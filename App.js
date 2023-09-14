import React, { useState } from 'react';
import { StatusBar, Image, TextInput, Button, StyleSheet, Text, View } from 'react-native';
import WebEngage from 'react-native-webengage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [eventName, setEventName] = useState('');
  const webengage = new WebEngage();

  const handleLogin = () => {
    if (username.trim() !== '') {
      webengage.user.login(username);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    webengage.user.logout();
    setIsLoggedIn(false);
  };

  const handleTrackEvent = () => {
    if (eventName.trim() !== '') {
      webengage.track(eventName);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome To WebEngage!</Text>
      {isLoggedIn ? (
        <View style={styles.loggedInContainer}>
          <Text style={styles.loggedInText}>You are logged in as {username}.</Text>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      ) : (
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Please enter your username:</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            onChangeText={(text) => setUsername(text)}
            value={username}
          />
          <Button title="Login" onPress={handleLogin} />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter Event Name"
        onChangeText={(text) => setEventName(text)}
        value={eventName}
      />
      <Button title="Track Event" onPress={handleTrackEvent} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loggedInContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loggedInText: {
    fontSize: 18,
    color: 'green',
    marginBottom: 10,
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 18,
    color: 'blue',
    marginBottom: 10,
  },
  image: {
    width: 400,
    height: 200,
    resizeMode: 'contain',
    marginTop: 20,
  },
  input: {
    height: 40,
    width: 300,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10,
    fontSize: 16,
  },
});
