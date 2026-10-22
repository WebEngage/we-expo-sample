#!/usr/bin/env python3
"""Runs the WebEngage + existing-extension scenarios and writes results/REPORT.md.

usage: python3 scripts/run-scenarios.py [--compile] [ID ...]
  no IDs      run every scenario
  --compile   after scenario C1, run pod install and compile the service extension for the simulator
              (needs network and a few GB of disk; no signing, no license, no device)

Needs: node_modules installed (npm ci --ignore-scripts, plus webengage-expo, webengage-expo-push,
react-native-webengage, expo-build-properties). Restores app.json when finished.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
RESULTS = os.path.join(ROOT, "results")
DEMO = "./plugins/withDemoPushExtensions"
MERGED = "./nse/NotificationService.merged.swift"
ENV = dict(os.environ, CI="1")

BUILD_PROPS = ["expo-build-properties", {"ios": {"useFrameworks": "static"}}]
WE = [
    "./node_modules/webengage-expo/src/withWebEngage.js",
    {
        "push": {"mode": "development"},
        "ios": {"WEGLicenseCode": "LICENSE_CODE", "WEGEnvironment": "DEFAULT", "WEGLogLevel": "VERBOSE", "WEGAutoRegister": True},
        "android": {"manifest": {"com.webengage.sdk.android.key": "LICENSE_CODE", "com.webengage.sdk.android.environment": "us"}},
    },
]


def wp(**extra):
    return ["webengage-expo-push", dict({"mode": "development", "iPhoneDeploymentTarget": "15.1"}, **extra)]


def demo(**names):
    return [DEMO, names] if names else DEMO


SAME = {"nseName": "NotificationService", "ceName": "NotificationViewController"}
EXISTING = {"iosNSEExistingTarget": True, "iosNSETargetName": "DemoNotificationService", "iosNSEFilePath": MERGED}

# id: (title, plugin list after the base plugins, second_prebuild_without_clean)
SCENARIOS = {
    "S0": ("Control: demo extensions only, no WebEngage", [BUILD_PROPS, demo()], False),
    "W0": ("WebEngage alone (no other extensions), prebuild twice", [BUILD_PROPS, WE, wp()], True),
    "A1": ("Demo extensions (different names), WebEngage listed AFTER", [BUILD_PROPS, demo(), WE, wp()], False),
    "A2": ("Demo extensions (different names), WebEngage listed BEFORE", [BUILD_PROPS, WE, wp(), demo()], False),
    "B1": ("Demo extensions with WebEngage's default names, WebEngage AFTER", [BUILD_PROPS, demo(**SAME), WE, wp()], False),
    "B2": ("Demo extensions with WebEngage's default names, WebEngage BEFORE", [BUILD_PROPS, WE, wp(), demo(**SAME)], False),
    "C0": ("Workaround, but the existing extension has NO Podfile target (hand-made, no pods)", [BUILD_PROPS, WE, wp(**EXISTING), demo()], False),
    "C1": ("Documented workaround, existing extension has a Podfile target, WebEngage BEFORE it", [BUILD_PROPS, WE, wp(**EXISTING), demo(podfileTarget=True)], False),
    "C2": ("Documented workaround, WebEngage AFTER the other plugin (should fail per skill)", [BUILD_PROPS, demo(podfileTarget=True), WE, wp(**EXISTING)], False),
    "D1": ("Documented workaround, then a second prebuild WITHOUT --clean", [BUILD_PROPS, WE, wp(**EXISTING), demo(podfileTarget=True)], True),
    "G1": ("Only the content extension collides (same name as WebEngage's), WebEngage AFTER", [BUILD_PROPS, demo(ceName="NotificationViewController"), WE, wp()], False),
    "G2": ("Only the content extension collides (same name as WebEngage's), WebEngage BEFORE", [BUILD_PROPS, WE, wp(), demo(ceName="NotificationViewController")], False),
}


def run(cmd, log, timeout=600, env=ENV, cwd=ROOT):
    t0 = time.time()
    with open(log, "w") as f:
        try:
            p = subprocess.run(cmd, shell=isinstance(cmd, str), stdout=f, stderr=subprocess.STDOUT, env=env, cwd=cwd, timeout=timeout)
            code = p.returncode
        except subprocess.TimeoutExpired:
            code = 124
    return code, round(time.time() - t0, 1)


def key_line(log):
    text = open(log, errors="replace").read()
    for pat in (r"Error: \[webengage-expo-push\][^\n]*", r"Error:[^\n]*", r"✖[^\n]*", r"Unable to[^\n]*"):
        m = re.search(pat, text)
        if m:
            return m.group(0)[:200]
    return ""


def checker(outdir):
    if not os.path.isdir("ios") or not any(n.endswith(".xcodeproj") for n in os.listdir("ios")):
        open(os.path.join(outdir, "check.txt"), "w").write("no ios project generated\n")
        return None, "no project"
    code, _ = run([sys.executable, "scripts/check-extensions.py", "--xcodebuild"], os.path.join(outdir, "check.txt"))
    text = open(os.path.join(outdir, "check.txt")).read()
    svc = re.search(r"Service extensions: (\d+)", text)
    ce = re.search(r"Content extensions: (\d+)", text)
    res = re.search(r"RESULT: (\w+)", text)
    return (res.group(1) if res else "?"), f"svc={svc.group(1) if svc else '?'} ce={ce.group(1) if ce else '?'}"


def save_artifacts(outdir):
    if not os.path.isdir("ios"):
        return
    if os.path.exists("ios/Podfile"):
        shutil.copy("ios/Podfile", os.path.join(outdir, "Podfile"))
    tree = []
    for d in sorted(os.listdir("ios")):
        p = os.path.join("ios", d)
        if os.path.isdir(p) and d not in ("Pods", "build") and not d.endswith(".xcodeproj"):
            for f in sorted(os.listdir(p)):
                tree.append(f"ios/{d}/{f}")
    open(os.path.join(outdir, "tree.txt"), "w").write("\n".join(tree) + "\n")
    for d in os.listdir("ios"):
        for f in ("NotificationService.swift", f"{d}.swift"):
            src = os.path.join("ios", d, f)
            if os.path.isfile(src) and "Notification" in d:
                shutil.copy(src, os.path.join(outdir, f"{d}__{f}"))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    compile_c1 = "--compile" in sys.argv
    ids = args or list(SCENARIOS)
    shutil.copy("app.json", "app.json.orig")
    base = json.load(open("app.json"))
    base_plugins = [p for p in base["expo"]["plugins"] if not any(k in json.dumps(p) for k in ("withDemoPushExtensions", "webengage", "expo-build-properties"))]
    os.makedirs(RESULTS, exist_ok=True)
    rows = []
    try:
        for sid in ids:
            title, plugins, twice = SCENARIOS[sid]
            outdir = os.path.join(RESULTS, sid)
            shutil.rmtree(outdir, ignore_errors=True)
            os.makedirs(outdir)
            cfg = json.loads(json.dumps(base))
            cfg["expo"]["plugins"] = base_plugins + plugins
            json.dump(cfg, open("app.json", "w"), indent=2)
            json.dump(plugins, open(os.path.join(outdir, "plugins.json"), "w"), indent=2)
            shutil.rmtree("ios", ignore_errors=True)
            print(f"[{sid}] {title}", flush=True)
            code, secs = run("npx expo prebuild --clean --no-install --platform ios", os.path.join(outdir, "prebuild.log"))
            note = key_line(os.path.join(outdir, "prebuild.log"))
            code2 = None
            if twice and code == 0:
                code2, _ = run("npx expo prebuild --no-install --platform ios", os.path.join(outdir, "prebuild2.log"))
                note2 = key_line(os.path.join(outdir, "prebuild2.log"))
                note = (note + " | 2nd: " + note2).strip(" |")
            result, counts = checker(outdir)
            save_artifacts(outdir)
            if sid == "C1" and compile_c1 and code == 0:
                env = dict(ENV, WEBENGAGE_DISABLE_SPM="true", LANG="en_US.UTF-8")
                pc, _ = run("pod install", os.path.join(outdir, "pod-install.log"), 900, env, os.path.join(ROOT, "ios"))
                if pc == 0:
                    bc, _ = run("xcodebuild -workspace ios/WEShop.xcworkspace -scheme DemoNotificationService -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build", os.path.join(outdir, "compile-nse.log"), 900)
                    compiled = "BUILD SUCCEEDED" in open(os.path.join(outdir, "compile-nse.log"), errors="replace").read()
                    note += f" | compile NSE: {'OK' if compiled else 'FAILED'}"
                else:
                    note += " | pod install FAILED"
            rows.append((sid, title, code, code2, result, counts, note))
            print(f"    prebuild exit {code}{'/' + str(code2) if code2 is not None else ''} ({secs}s) check={result} {counts} {note}", flush=True)
    finally:
        shutil.move("app.json.orig", "app.json")
        shutil.rmtree("ios", ignore_errors=True)

    with open(os.path.join(RESULTS, "REPORT.md"), "w") as f:
        f.write("# Extension coexistence: scenario report\n\n")
        f.write(f"Generated {time.strftime('%Y-%m-%d %H:%M')} from branch `{subprocess.run(['git','branch','--show-current'],capture_output=True,text=True).stdout.strip()}`.\n\n")
        f.write("| ID | Scenario | Prebuild exit (2nd) | Checker | Extensions | Notes |\n|---|---|---|---|---|---|\n")
        for sid, title, code, code2, result, counts, note in rows:
            f.write(f"| {sid} | {title} | {code}{'/' + str(code2) if code2 is not None else ''} | {result} | {counts} | {note.replace('|', '/')} |\n")
        f.write("\nPer-scenario logs, Podfile, folder listing and Swift files are in `results/<ID>/`.\n")
    print("Report: results/REPORT.md")


if __name__ == "__main__":
    main()
