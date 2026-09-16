import { ReactNode } from 'react';
import { GoalsProvider } from './GoalsContext';
import { LectureProvider } from './LectureContext';
import { PhraseProvider } from './PhraseContext';
import { ProfileProvider } from './ProfileContext';
import { TalkProvider } from './TalkContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <LectureProvider>
        <PhraseProvider>
          <TalkProvider>
            <GoalsProvider>{children}</GoalsProvider>
          </TalkProvider>
        </PhraseProvider>
      </LectureProvider>
    </ProfileProvider>
  );
}
