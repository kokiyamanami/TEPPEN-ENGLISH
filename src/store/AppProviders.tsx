import { ReactNode } from 'react';
import { GeneratedContentProvider } from './GeneratedContentContext';
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
            <GoalsProvider>
              <GeneratedContentProvider>{children}</GeneratedContentProvider>
            </GoalsProvider>
          </TalkProvider>
        </PhraseProvider>
      </LectureProvider>
    </ProfileProvider>
  );
}
