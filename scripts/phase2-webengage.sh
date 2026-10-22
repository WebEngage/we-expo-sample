#!/bin/bash
# Phase 2: add WebEngage to the app that already has its own extensions, then check the result.
# Uses the documented workaround (iosNSEExistingTarget + merged Swift file + WebEngage listed first).
# usage: bash scripts/phase2-webengage.sh        (needs network; no license, no device)
set -u
cd "$(dirname "$0")/.."
for f in plugins/withDemoPushExtensions.js scripts/check-extensions.py scripts/run-scenarios.py nse/NotificationService.merged.swift; do
  [ -f "$f" ] || { echo "MISSING $f - run the Phase 1 setup first"; exit 1; }
done
echo "== 1/3 installing WebEngage packages (install scripts disabled)"
npm install --ignore-scripts --no-audit --no-fund \
  react-native-webengage@2.1.0 webengage-expo@0.0.3 webengage-expo-push@${WE_PUSH_VERSION:-1.0.0} expo-build-properties@55.0.18 \
  > /tmp/phase2-npm.log 2>&1 || { echo "npm install failed, see /tmp/phase2-npm.log"; exit 1; }
echo "== 2/3 prebuild + checks + pod install + extension compile (takes a few minutes)"
python3 scripts/run-scenarios.py --compile C1 | sed 's/^/   /'
echo "== 3/3 summary"
D=results/C1
{
  echo "repo: $(pwd)"; echo "branch: $(git branch --show-current)"
  echo "webengage-expo-push: $(node -p "require('./node_modules/webengage-expo-push/package.json').version")"
  echo "--- prebuild exit/notes:"; sed -n 7p results/REPORT.md | cut -c1-400
  echo "--- checker:"; grep -E "^(Service extensions|Content extensions|WARN|FAIL|RESULT)|== (Service|Content) extensions|compiled=" $D/check.txt | cut -c1-260
  echo "--- pod install:"; if [ -f $D/pod-install.log ]; then grep -E "\[!\]|Pod installation complete" $D/pod-install.log | grep -v "script phase" | head -6 | cut -c1-260; else echo "(not run)"; fi
  echo "--- extension compile:"; if [ -f $D/compile-nse.log ]; then grep -E "error:|BUILD (SUCCEEDED|FAILED)" $D/compile-nse.log | head -6 | cut -c1-260; else echo "(not run)"; fi
  echo "--- files in the service extension folder:"; grep -E "DemoNotificationService/" $D/tree.txt
} | tee $D/SUMMARY.txt
echo; echo "Send me: $(pwd)/$D/SUMMARY.txt"
