import { ReactNode } from 'react';
import { GeneratedContentProvider } from './GeneratedContentContext';
import { GoalsProvider } from './GoalsContext';
import { LectureProvider } from './LectureContext';
import { PhraseProvider } from './PhraseContext';
import { ProfileProvider } from './ProfileContext';
import { SessionProvider } from './SessionContext';
import { TalkProvider } from './TalkContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
