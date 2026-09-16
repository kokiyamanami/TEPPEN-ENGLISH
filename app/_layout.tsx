import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PhraseRegisterModal } from '../src/components/PhraseRegisterModal';
import { LectureProvider } from '../src/store/LectureContext';
import { PhraseProvider } from '../src/store/PhraseContext';
import { ProfileProvider } from '../src/store/ProfileContext';
import { TalkProvider } from '../src/store/TalkContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <LectureProvider>
          <PhraseProvider>
            <TalkProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <PhraseRegisterModal />
            </TalkProvider>
          </PhraseProvider>
        </LectureProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
