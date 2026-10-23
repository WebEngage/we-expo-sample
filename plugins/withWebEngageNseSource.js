/**
 * Copies a Swift file over the source file that another plugin generates for the app's own
 * Notification Service Extension.
 *
 * Why: webengage-expo-push (iosNSEExistingTarget) copies the merged service-extension file to
 * <target name>.swift and never adds it to the Xcode project, so it only takes effect when the
 * existing extension happens to compile a file with that exact name. When it compiles another
 * name, this plugin puts the merged file where the extension actually builds it.
 *
 * Props:
 *   from  path of the merged Swift file, relative to the project root
 *   to    file to overwrite, relative to ios/ (the file the existing extension compiles)
 *
 * Listed BEFORE the plugin that generates the extension: dangerous mods run in reverse order,
 * so this runs after that plugin has written its own file.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withWebEngageNseSource(config, props = {}) {
  const { from, to } = props;
  if (!from || !to) {
    throw new Error('[withWebEngageNseSource] both "from" and "to" are required');
  }

  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const source = path.join(cfg.modRequest.projectRoot, from);
      const target = path.join(cfg.modRequest.platformProjectRoot, to);

      if (!fs.existsSync(source)) {
        throw new Error(`[withWebEngageNseSource] ${from} does not exist`);
      }
      // Stopping is deliberate: skipping silently would leave Rich Push off with no sign of it.
      if (!fs.existsSync(target)) {
        throw new Error(
          `[withWebEngageNseSource] ios/${to} was not found. List this plugin BEFORE the plugin ` +
            'that generates the service extension, so it runs after that plugin has written its file.'
        );
      }

      fs.copyFileSync(source, target);
      console.log(`[withWebEngageNseSource] Copied ${from} to ios/${to}`);
      return cfg;
    },
  ]);
};
