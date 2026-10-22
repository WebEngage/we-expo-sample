import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button, SectionTitle, card } from '@/components/ui';
import { colors } from '@/constants/theme';

// Category the demo content extension is registered for (UNNotificationExtensionCategory).
const CATEGORY = 'DEMO_CATEGORY';

// Show notifications even while the app is open, so a local test is visible without backgrounding.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const SAMPLE_PAYLOAD = JSON.stringify(
  { aps: { alert: { title: 'Extension test', body: 'hello' }, 'mutable-content': 1, category: CATEGORY, sound: 'default' } },
  null,
  2
);

/** No push SDK here: only the system notification APIs, to exercise the app's own service and content extensions. */
export default function PushTest() {
  const [status, setStatus] = useState('not requested');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const askPermission = async () => {
    const res = await Notifications.requestPermissionsAsync();
    setStatus(res.status);
  };

  const getToken = async () => {
    try {
      const t = await Notifications.getDevicePushTokenAsync();
      setToken(String(t.data));
      setMessage('');
    } catch (e) {
      setMessage(`Token failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const scheduleLocal = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Local test', body: 'content extension check', categoryIdentifier: CATEGORY },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    });
    setMessage('Scheduled. Lock the phone or go Home, then long-press the notification when it arrives.');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.note}>
        Tests the app's own notification extensions. A local notification can only exercise the content extension; the
        service extension runs only for a real push with mutable-content.
      </Text>

      <SectionTitle>1. Permission</SectionTitle>
      <View style={card}>
        <Text style={styles.value} testID="push-status">Status: {status}</Text>
        <Button title="Allow notifications" onPress={askPermission} testID="push-allow" />
      </View>

      <SectionTitle>2. Local notification (content extension)</SectionTitle>
      <View style={card}>
        <Text style={styles.value}>Category: {CATEGORY}</Text>
        <Button title="Send local notification in 5s" onPress={scheduleLocal} variant="secondary" testID="push-local" />
      </View>

      <SectionTitle>3. Real push (service + content extension)</SectionTitle>
      <View style={card}>
        <Button title="Get APNs device token" onPress={getToken} variant="secondary" testID="push-token" />
        {token ? (
          <>
            <Text style={styles.token} selectable testID="push-token-value">{token}</Text>
            <Button title="Share token" onPress={() => Share.share({ message: token })} variant="ghost" />
          </>
        ) : null}
        <Text style={styles.label}>Payload to send (topic = bundle id, Sandbox, push type alert, priority 10):</Text>
        <Text style={styles.payload} selectable>{SAMPLE_PAYLOAD}</Text>
      </View>

      {!!message && <Text style={styles.note}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  note: { color: colors.muted, fontSize: 13 },
  value: { color: colors.text, fontWeight: '600', marginBottom: 8 },
  label: { color: colors.muted, fontSize: 12, marginTop: 12 },
  token: { fontFamily: 'Courier', fontSize: 12, color: colors.text, marginVertical: 8 },
  payload: { fontFamily: 'Courier', fontSize: 12, color: colors.text, marginTop: 4 },
});
