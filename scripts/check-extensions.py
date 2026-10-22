#!/usr/bin/env python3
"""Static check of the iOS notification extensions in ios/ after `expo prebuild`.

Counts extensions by what their Info.plist declares (not by name), so a renamed second
service extension is still caught. No build, no device, no license.

usage: python3 scripts/check-extensions.py [--xcodebuild]
exit code 0 = all hard checks pass, 1 = at least one FAIL
"""
import glob
import json
import os
import re
import subprocess
import sys

SERVICE = "com.apple.usernotifications.service"
CONTENT = "com.apple.usernotifications.content-extension"
EXT_TYPE = "com.apple.product-type.app-extension"
APP_TYPE = "com.apple.product-type.application"


def plist_json(path):
    out = subprocess.run(["plutil", "-convert", "json", "-o", "-", path], capture_output=True, text=True)
    if out.returncode != 0:
        return None
    return json.loads(out.stdout)


def dup_podfile_targets(names):
    return sorted({n for n in names if names.count(n) > 1})


def main():
    projects = glob.glob("ios/*.xcodeproj/project.pbxproj")
    if not projects:
        print("FAIL: no ios/*.xcodeproj found. Run prebuild first.")
        return 1
    pbx = plist_json(projects[0])
    if pbx is None:
        print("FAIL: could not parse", projects[0])
        return 1
    objs = pbx["objects"]
    fails, warns = [], []

    def cfg_settings(target):
        lst = objs.get(target.get("buildConfigurationList"), {})
        for ref in lst.get("buildConfigurations", []):
            s = objs[ref].get("buildSettings", {})
            if s.get("INFOPLIST_FILE") or s.get("PRODUCT_BUNDLE_IDENTIFIER"):
                return s
        return {}

    targets = [(k, v) for k, v in objs.items() if v.get("isa") == "PBXNativeTarget"]
    names = [v.get("name") for _, v in targets]
    print("== Targets in project.pbxproj")
    rows = []
    for uuid, t in targets:
        s = cfg_settings(t)
        kind = {APP_TYPE: "app", EXT_TYPE: "extension"}.get(t.get("productType"), t.get("productType"))
        point, principal, groups = "", "", []
        if t.get("productType") == EXT_TYPE:
            ipath = s.get("INFOPLIST_FILE", "").strip('"')
            info = plist_json(os.path.join("ios", ipath)) if ipath else None
            ext = (info or {}).get("NSExtension", {})
            point = ext.get("NSExtensionPointIdentifier", "(none)")
            principal = ext.get("NSExtensionPrincipalClass", ext.get("NSExtensionMainStoryboard", ""))
            epath = s.get("CODE_SIGN_ENTITLEMENTS", "").strip('"')
            ent = plist_json(os.path.join("ios", epath)) if epath else None
            groups = (ent or {}).get("com.apple.security.application-groups", [])
        rows.append((t.get("name"), kind, point, principal, groups, uuid))
        print(f"  {t.get('name'):34} {kind:10} {point.replace('com.apple.usernotifications.', ''):18} groups={groups}")

    dup = {n for n in names if names.count(n) > 1}
    if dup:
        fails.append(f"duplicate target names: {sorted(dup)}")

    services = [r for r in rows if r[2] == SERVICE]
    contents = [r for r in rows if r[2] == CONTENT]
    print(f"\n== Service extensions: {len(services)} {[r[0] for r in services]}")
    print(f"== Content extensions: {len(contents)} {[r[0] for r in contents]}")
    if len(services) != 1:
        fails.append(f"expected exactly 1 service extension, found {len(services)}")
    if len(contents) > 1:
        warns.append(f"{len(contents)} content extensions: check their UNNotificationExtensionCategory values do not overlap")

    # Which Swift files does each service extension actually compile? (a merged file that is only
    # copied to disk, not referenced by the project, would silently never run)
    print("\n== Service extension sources")
    pod_text = open("ios/Podfile").read() if os.path.exists("ios/Podfile") else ""
    webengage_in_play = "WEServiceExtension" in pod_text
    for uuid, t in targets:
        if t.get("name") not in [r[0] for r in services]:
            continue
        compiled = []
        for ref in t.get("buildPhases", []):
            ph = objs.get(ref, {})
            if ph.get("isa") == "PBXSourcesBuildPhase":
                for f in ph.get("files", []):
                    fr = objs.get(objs.get(f, {}).get("fileRef"), {})
                    if fr.get("path"):
                        compiled.append(fr["path"])
        folder = os.path.join("ios", t["name"])
        on_disk = sorted(f for f in os.listdir(folder) if f.endswith(".swift")) if os.path.isdir(folder) else []
        read = lambda n: open(os.path.join(folder, n)).read() if os.path.exists(os.path.join(folder, n)) else ""
        uncompiled = [f for f in on_disk if f not in compiled]
        print(f"  {t['name']}: compiled={compiled} on_disk={on_disk}")
        if uncompiled:
            warns.append(f"{t['name']}: Swift file(s) on disk but not compiled: {uncompiled}")
        if webengage_in_play:
            if not any("WEXPushNotificationService" in read(f) for f in compiled):
                msg = f"{t['name']}: WebEngage is in the Podfile but no compiled source uses WEXPushNotificationService"
                if any("WEXPushNotificationService" in read(f) for f in uncompiled):
                    msg += " (the WebEngage/merged file is on disk but NOT compiled)"
                fails.append(msg)

    # Embedded in the main app?
    app = next((v for _, v in targets if v.get("productType") == APP_TYPE), None)
    embedded = set()
    if app:
        for ref in app.get("buildPhases", []):
            ph = objs.get(ref, {})
            if ph.get("isa") == "PBXCopyFilesBuildPhase":
                for f in ph.get("files", []):
                    fr = objs.get(objs.get(f, {}).get("fileRef"), {})
                    p = fr.get("path", "")
                    if p.endswith(".appex"):
                        embedded.add(p[:-6])
    ext_names = {r[0] for r in rows if r[1] == "extension"}
    print(f"\n== Embedded in main app: {sorted(embedded)}")
    missing = ext_names - embedded
    if missing:
        fails.append(f"extension targets not embedded in the app: {sorted(missing)}")

    # Podfile
    print("\n== Podfile targets")
    pod = open("ios/Podfile").read() if os.path.exists("ios/Podfile") else ""
    pod_targets = re.findall(r"^\s*target\s+['\"]([^'\"]+)['\"]", pod, re.M)
    print("  ", pod_targets or "(no Podfile)")
    blocks = dict(re.findall(r"^\s*target\s+['\"]([^'\"]+)['\"]\s+do(.*?)^end", pod, re.M | re.S))
    holders = [n for n, body in blocks.items() if "WEServiceExtension" in body]
    print("   targets that link WEServiceExtension:", holders or "(none)")
    if holders:
        service_names = [r[0] for r in services]
        for h in holders:
            if h not in service_names:
                fails.append(f"WEServiceExtension is linked in Podfile target '{h}', which is not a service extension in the project")
        if not any(h in service_names for h in holders):
            fails.append("WEServiceExtension is not linked in the project's service extension")
    for n in dup_podfile_targets(pod_targets):
        fails.append(f"Podfile declares target '{n}' more than once")

    # App Groups consistency (informational)
    all_groups = {tuple(sorted(r[4])) for r in rows if r[1] == "extension"}
    if len(all_groups) > 1:
        warns.append(f"extensions declare different App Group sets: {sorted(all_groups)}")

    if "--xcodebuild" in sys.argv:
        print("\n== xcodebuild -list")
        proj = os.path.dirname(projects[0])
        out = subprocess.run(["xcodebuild", "-list", "-project", proj], capture_output=True, text=True)
        print(out.stdout[-1500:] if out.returncode == 0 else out.stderr[-800:])
        if out.returncode != 0:
            fails.append("xcodebuild -list failed")

    print()
    for w in warns:
        print("WARN:", w)
    for f in fails:
        print("FAIL:", f)
    print("RESULT:", "FAIL" if fails else "PASS")
    return 1 if fails else 0


sys.exit(main())
