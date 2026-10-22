/**
 * Test-only Expo config plugin: adds a Notification Service Extension and a Notification Content
 * Extension to the iOS app, with no vendor SDK and no license. It stands in for "an app that
 * already has its own extensions" so another push plugin can be added afterwards.
 *
 * Options (all optional):
 *   nseName   target/folder name of the service extension   default "DemoNotificationService"
 *   ceName    target/folder name of the content extension   default "DemoNotificationContent"
 *   category  UNNotificationExtensionCategory of the content extension   default "DEMO_CATEGORY"
 *   appGroup  App Group written to both extensions' entitlements  default group.<bundle id>.demo
 *   disableCE set true to create only the service extension
 *   podfileTarget set true to also add an (empty) Podfile target block per extension, as vendor plugins
 *             that depend on pods do
 *
 * Use nseName "NotificationService" (and ceName "NotificationViewController") to reproduce a
 * same-name clash with webengage-expo-push's defaults.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');

const DEPLOYMENT_TARGET = '15.1';

const infoPlist = (name, extension) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>${name}</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>NSExtension</key>
${extension}
</dict>
</plist>
`;

const nseExtension = `	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.usernotifications.service</string>
		<key>NSExtensionPrincipalClass</key>
		<string>$(PRODUCT_MODULE_NAME).NotificationService</string>
	</dict>`;

const ceExtension = (category) => `	<dict>
		<key>NSExtensionAttributes</key>
		<dict>
			<key>UNNotificationExtensionCategory</key>
			<string>${category}</string>
			<key>UNNotificationExtensionInitialContentSizeRatio</key>
			<real>0.5</real>
		</dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.usernotifications.content-extension</string>
		<key>NSExtensionPrincipalClass</key>
		<string>$(PRODUCT_MODULE_NAME).NotificationViewController</string>
	</dict>`;

const entitlements = (group) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>${group}</string>
	</array>
</dict>
</plist>
`;

const nseSwift = `import UserNotifications

// Demo service extension: marks the body so a delivered push shows it ran.
class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttempt: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest,
                             withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttempt = (request.content.mutableCopy() as? UNMutableNotificationContent)
        if let content = bestAttempt {
            content.body = "[demo-nse] " + content.body
            contentHandler(content)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let handler = contentHandler, let content = bestAttempt { handler(content) }
    }
}
`;

const ceSwift = `import UIKit
import UserNotifications
import UserNotificationsUI

// Demo content extension: a single label, built in code (no storyboard).
class NotificationViewController: UIViewController, UNNotificationContentExtension {
    private let label = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    func didReceive(_ notification: UNNotification) {
        label.text = "[demo-ce] " + notification.request.content.body
    }
}
`;

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function writeFiles(iosPath, group, spec) {
  const dir = path.join(iosPath, spec.name);
  write(path.join(dir, spec.swiftFile), spec.swift);
  write(path.join(dir, `${spec.name}-Info.plist`), infoPlist(spec.name, spec.extension));
  write(path.join(dir, `${spec.name}.entitlements`), entitlements(group));
}

function addTarget(xcodeProject, bundleId, spec) {
  // pbxTargetByName() only matches the quoted form that addTarget() stores
  if (xcodeProject.pbxTargetByName(spec.name) || xcodeProject.pbxTargetByName(`"${spec.name}"`)) return;

  const files = [spec.swiftFile, `${spec.name}-Info.plist`, `${spec.name}.entitlements`];
  const group = xcodeProject.addPbxGroup(files, spec.name, spec.name);
  const groups = xcodeProject.hash.project.objects.PBXGroup;
  Object.keys(groups).forEach((key) => {
    if (typeof groups[key] === 'object' && groups[key].name === undefined && groups[key].path === undefined) {
      xcodeProject.addToPbxGroup(group.uuid, key);
    }
  });

  const objects = xcodeProject.hash.project.objects;
  objects.PBXTargetDependency = objects.PBXTargetDependency || {};
  objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};

  const target = xcodeProject.addTarget(spec.name, 'app_extension', spec.name, `${bundleId}.${spec.name}`);
  xcodeProject.addBuildPhase([spec.swiftFile], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
  xcodeProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
  xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

  const configs = xcodeProject.pbxXCBuildConfigurationSection();
  for (const key in configs) {
    const settings = configs[key].buildSettings;
    if (settings && settings.PRODUCT_NAME === `"${spec.name}"`) {
      settings.INFOPLIST_FILE = `${spec.name}/${spec.name}-Info.plist`;
      settings.CODE_SIGN_ENTITLEMENTS = `${spec.name}/${spec.name}.entitlements`;
      settings.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
      settings.TARGETED_DEVICE_FAMILY = '"1,2"';
      settings.SWIFT_VERSION = '5.0';
      settings.CODE_SIGN_STYLE = 'Automatic';
      settings.MARKETING_VERSION = '1.0';
      settings.CURRENT_PROJECT_VERSION = '1';
    }
  }
}

module.exports = function withDemoPushExtensions(config, props = {}) {
  const bundleId = config.ios && config.ios.bundleIdentifier;
  if (!bundleId) throw new Error('[withDemoPushExtensions] ios.bundleIdentifier is required');

  const group = props.appGroup || `group.${bundleId}.demo`;
  const specs = [
    {
      name: props.nseName || 'DemoNotificationService',
      swiftFile: 'NotificationService.swift',
      swift: nseSwift,
      extension: nseExtension,
    },
  ];
  if (!props.disableCE) {
    specs.push({
      name: props.ceName || 'DemoNotificationContent',
      swiftFile: 'NotificationViewController.swift',
      swift: ceSwift,
      extension: ceExtension(props.category || 'DEMO_CATEGORY'),
    });
  }

  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const iosPath = path.join(cfg.modRequest.projectRoot, 'ios');
      specs.forEach((spec) => writeFiles(iosPath, group, spec));
      if (props.podfileTarget) {
        const podfile = path.join(iosPath, 'Podfile');
        let text = fs.readFileSync(podfile, 'utf8');
        specs.forEach((spec) => {
          if (!text.includes(`target '${spec.name}'`)) text += `\ntarget '${spec.name}' do\nend\n`;
        });
        fs.writeFileSync(podfile, text);
      }
      return cfg;
    },
  ]);

  return withXcodeProject(config, (cfg) => {
    specs.forEach((spec) => addTarget(cfg.modResults, bundleId, spec));
    return cfg;
  });
};
