import { ReactNode } from 'react';
import { GeneratedContentProvider } from './GeneratedContentContext';
import { GoalsProvider } from './GoalsContext';
import { LectureProvider } from './LectureContext';
import { PhraseProvider } from './PhraseContext';
import { ProfileProvider } from './ProfileContext';
import { SessionProvider } from './SessionContext';
import { StatsProvider } from './StatsContext';
import { TalkProvider } from './TalkContext';
import { WordLookupProvider } from './WordLookupContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ProfileProvider>
        <StatsProvider>
          <LectureProvider>
            <PhraseProvider>
              <TalkProvider>
                <GoalsProvider>
                  <GeneratedContentProvider>
                    <WordLookupProvider>{children}</WordLookupProvider>
                  </GeneratedContentProvider>
                </GoalsProvider>
              </TalkProvider>
            </PhraseProvider>
          </LectureProvider>
        </StatsProvider>
      </ProfileProvider>
    </SessionProvider>
  );
}
