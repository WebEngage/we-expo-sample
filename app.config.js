// Extends app.json (Expo passes it in as `config`); nothing in app.json moves.
const licenseCode = process.env.WEBENGAGE_LICENSE_CODE ?? '';

// EAS_BUILD_PROFILE is unset in local builds; APP_VARIANT works locally
// (e.g. APP_VARIANT=production npx expo run:ios --configuration Release).
const variant = process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE;
const isProduction = variant === 'production';

// A missing license code must never stop a teammate's checkout, a CI job, an
// unrelated Expo command, or an already-running dev server — so by default it
// is only a loud warning. The one exception is a PRODUCTION build, where
// shipping without a key would silently send no data to WebEngage.
if (!licenseCode) {
  const message =
    'WEBENGAGE_LICENSE_CODE is not set — WebEngage will not start in this build. ' +
    'Copy .env.example to .env (cloud builds: set it as an EAS environment variable).';
  if (isProduction) throw new Error(message);
  console.warn(`[WebEngage] ${message}`);
}

// WebEngage's plugins are listed before the app's own notification-extension
// plugin: webengage-expo-push shares that plugin's service extension and must
// run after it creates the target.
const OWN_EXTENSIONS_PLUGIN = './plugins/withDemoPushExtensions';
const entryName = (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);

module.exports = ({ config }) => {
  const webengagePlugins = [
    [
      './node_modules/webengage-expo/src/withWebEngage.js',
      {
        push: { mode: isProduction ? 'production' : 'development' },
        ios: {
          WEGLicenseCode: licenseCode,
          WEGEnvironment: 'DEFAULT',
          WEGLogLevel: isProduction ? 'DEFAULT' : 'VERBOSE',
          WEGAutoRegister: true,
        },
      },
    ],
    [
      'webengage-expo-push',
      {
        mode: isProduction ? 'production' : 'development',
        // Must equal the app's iOS deployment target (ios/Podfile default).
        iPhoneDeploymentTarget: '15.1',
        // Signs the WebEngage extension for local device builds, with the team already in app.json.
        ...(config.ios?.appleTeamId ? { devTeam: config.ios.appleTeamId } : {}),
        // iOS allows one service extension and the app's own plugin already creates it,
        // so WebEngage shares it through a merged NotificationService.swift.
        iosNSEExistingTarget: true,
        iosNSETargetName: 'DemoNotificationService',
        iosNSEFilePath: './nse/NotificationService.merged.swift',
      },
    ],
    // webengage-expo-push copies the merged file to DemoNotificationService.swift, but the app's
    // own extension compiles NotificationService.swift: put the merged file there too.
    [
      './plugins/withWebEngageNseSource',
      {
        from: './nse/NotificationService.merged.swift',
        to: 'DemoNotificationService/NotificationService.swift',
      },
    ],
  ];

  const existing = config.plugins ?? [];
  const at = existing.findIndex((plugin) => entryName(plugin) === OWN_EXTENSIONS_PLUGIN);
  const index = at === -1 ? existing.length : at;

  return {
    ...config,
    plugins: [...existing.slice(0, index), ...webengagePlugins, ...existing.slice(index)],
  };
};
