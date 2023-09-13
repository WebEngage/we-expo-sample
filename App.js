import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import WebEngage from 'react-native-webengage';


export default function App() {
  const webengage = new WebEngage();
  // Change userName to test this in your dashboard
  webengage.user.login("testUser");

  const track = () => {
    webengage.track("Testing Event")
  }

  return (
    <View style={styles.container}>
      <Text>Welcome To WebEngage!</Text>
      <Button title='track Test event' onPress={track} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
