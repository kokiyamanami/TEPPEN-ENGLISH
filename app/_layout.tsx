import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LectureProvider } from '../src/store/LectureContext';
import { ProfileProvider } from '../src/store/ProfileContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <LectureProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </LectureProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
