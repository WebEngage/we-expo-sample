## Steps to Run the Sample App

1. **Clone the Sample App**: Clone the repository to your local machine.
2. **Install Dependencies**: Navigate to the project directory and install the necessary dependencies using `npm install` or `yarn`.
3. **Start the Development Server**: Run the command `npx expo start` to start the Expo development server. You can then run the app on an Android or iOS device.

## Steps to Integrate WebEngage

1. Run `expo prebuild`:
   ```bash
   expo prebuild

   ```

This will generate the android and ios directories. For more details, refer to the [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/).

2. Follow the WebEngage integration steps mentioned in the React Native Integration [documentation](https://docs.webengage.com/docs/react-native)

**Note**: Native integration for Expo is required for WebEngage integration.

## Why Use Expo Prebuild?

The `expo prebuild` command is designed to generate the necessary native project files for iOS and Android within an Expo-managed project. This approach allows you to integrate native modules and code modifications without fully converting your Expo project to a standard React Native CLI project.

### Purpose of Expo Prebuild

- **Native Files Generation:** It creates the `ios` and `android` directories with the necessary native project files.
- **Expo Benefits:** You retain many benefits of Expo's managed workflow, such as easy updates and access to Expo's extensive suite of tools and services.

### Why It's Suitable for WebEngage Integration

- **Custom Native Code:** The generated files allow you to follow the WebEngage integration steps that involve modifying `MainApplication.java`, `AndroidManifest.xml`, `Info.plist`, and `AppDelegate.m`.
- **Maintaining Expo Features:** This method provides a middle ground where you can add custom native functionality without losing the streamlined development experience provided by Expo.

### Clarification on Conversion

- **Not Full Conversion:** Running `expo prebuild` does not fully convert your Expo project to a React Native CLI project. It simply provides the necessary native files for custom code integration.
- **Managed Workflow:** Your project remains an Expo-managed project, allowing you to continue using Expo's build and development tools.
