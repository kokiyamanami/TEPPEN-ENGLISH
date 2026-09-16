import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PhraseRegisterModal } from '../src/components/PhraseRegisterModal';
import { AppProviders } from '../src/store/AppProviders';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <PhraseRegisterModal />
      </AppProviders>
    </SafeAreaProvider>
  );
}
