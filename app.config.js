const fs = require('fs');

const licenseCode = process.env.WEBENGAGE_LICENSE_CODE ?? '';

// EAS_BUILD_PROFILE is unset in local builds; APP_VARIANT works locally.
const variant = process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE;
const isProduction = variant === 'production';

// A missing license code must never stop a teammate's checkout, a CI job, an
// unrelated Expo command, or an already-running dev server — so by default it
// is only a loud warning. The one exception is a PRODUCTION build, where
// shipping without a key would silently send no data to WebEngage: that one
// fails, with the fix spelled out.
if (!licenseCode) {
  const message =
    'WEBENGAGE_LICENSE_CODE is not set — WebEngage will not start in this build. ' +
    'Copy .env.example to .env (cloud builds: set it as an EAS environment variable).';
  if (isProduction) throw new Error(message);
  console.warn(`[WebEngage] ${message}`);
}

// FCM delivery on Android needs google-services.json. It is only referenced when
// the file exists, so a checkout without it still prebuilds and runs.
const hasGoogleServices = fs.existsSync('./google-services.json');

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
  },
  plugins: [
    ...(config.plugins ?? []),
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
        android: {
          manifest: {
            'com.webengage.sdk.android.key': licenseCode,
            'com.webengage.sdk.android.environment': 'us',
            'com.webengage.sdk.android.debug': !isProduction,
          },
        },
      },
    ],
    // iOS only: Rich Push extensions. mode must equal push.mode above.
    ['webengage-expo-push', { mode: isProduction ? 'production' : 'development' }],
    './plugins/withWebEngageAndroidExtras.js',
  ],
});
