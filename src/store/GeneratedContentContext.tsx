import { createContext, ReactNode, useContext, useState } from 'react';
import { GeneratedDialogue, GeneratedPresentation } from '../api/generation';

type GeneratedContentValue = {
  currentDialogue: GeneratedDialogue | null;
  setCurrentDialogue: (d: GeneratedDialogue | null) => void;
  currentPresentation: GeneratedPresentation | null;
  setCurrentPresentation: (p: GeneratedPresentation | null) => void;
};

const GeneratedContentContext = createContext<GeneratedContentValue | null>(null);

// situational_dialogue -> dialogue_roleplay、presentation_material -> presentation_practice
// 間で「今表示している生成済み教材」を共有するための軽量ストア
export function GeneratedContentProvider({ children }: { children: ReactNode }) {
  const [currentDialogue, setCurrentDialogue] = useState<GeneratedDialogue | null>(null);
  const [currentPresentation, setCurrentPresentation] = useState<GeneratedPresentation | null>(null);

  return (
    <GeneratedContentContext.Provider value={{ currentDialogue, setCurrentDialogue, currentPresentation, setCurrentPresentation }}>
      {children}
    </GeneratedContentContext.Provider>
  );
}

export function useGeneratedContent() {
  const ctx = useContext(GeneratedContentContext);
  if (!ctx) throw new Error('useGeneratedContent must be used within GeneratedContentProvider');
  return ctx;
}
