const { withAppBuildGradle } = require('expo/config-plugins');

// Google Play Install Referrer — needed for WebEngage's "App Installed" event
// and First Acquisition Details.
module.exports = (config) =>
  withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('com.android.installreferrer')) {
      c.modResults.contents = c.modResults.contents.replace(
        /^dependencies\s*\{/m,
        (m) => `${m}\n    implementation 'com.android.installreferrer:installreferrer:2.2'`
      );
    }
    return c;
  });
