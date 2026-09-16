import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { PHRASE_FOLDERS_SEED, PHRASES_SEED, PhraseFolderSource } from '../data/phraseSeed';

export type PhraseFolder = { id: string; name: string; source: PhraseFolderSource };
export type Phrase = { id: string; folderId: string; text: string; textJP: string; learned: boolean };

type RegisterState = { visible: boolean; text: string; editable: boolean; folderId: string | null };

type PhraseContextValue = {
  folders: PhraseFolder[];
  phrases: Phrase[];
  folderCount: (folderId: string) => number;
  addFolder: (name: string) => string;
  deleteFolder: (id: string) => void;
  toggleLearned: (id: string) => void;
  registerState: RegisterState;
  openRegister: (text: string, editable: boolean, folderId?: string | null) => void;
  closeRegister: () => void;
  confirmRegister: (text: string, folderId: string) => void;
};

const PhraseContext = createContext<PhraseContextValue | null>(null);

let folderIdCounter = 100;
let phraseIdCounter = 100;

export function PhraseProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<PhraseFolder[]>(PHRASE_FOLDERS_SEED);
  const [phrases, setPhrases] = useState<Phrase[]>(PHRASES_SEED.map((p) => ({ ...p, learned: false })));
  const [registerState, setRegisterState] = useState<RegisterState>({
    visible: false,
    text: '',
    editable: true,
    folderId: null,
  });

  const folderCount = (folderId: string) => phrases.filter((p) => p.folderId === folderId).length;

  const addFolder = (name: string) => {
    const id = `f${folderIdCounter++}`;
    setFolders((prev) => [...prev, { id, name, source: 'custom' }]);
    return id;
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setPhrases((prev) => prev.filter((p) => p.folderId !== id));
  };

  const toggleLearned = (id: string) => {
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, learned: !p.learned } : p)));
  };

  const openRegister = (text: string, editable: boolean, folderId: string | null = null) => {
    setRegisterState({ visible: true, text, editable, folderId: folderId ?? folders[0]?.id ?? null });
  };

  const closeRegister = () => setRegisterState((prev) => ({ ...prev, visible: false }));

  const confirmRegister = (text: string, folderId: string) => {
    const id = `p${phraseIdCounter++}`;
    setPhrases((prev) => [...prev, { id, folderId, text, textJP: '', learned: false }]);
    setRegisterState((prev) => ({ ...prev, visible: false }));
  };

  const value = useMemo(
    () => ({ folders, phrases, folderCount, addFolder, deleteFolder, toggleLearned, registerState, openRegister, closeRegister, confirmRegister }),
    [folders, phrases, registerState]
  );

  return <PhraseContext.Provider value={value}>{children}</PhraseContext.Provider>;
}

export function usePhrases() {
  const ctx = useContext(PhraseContext);
  if (!ctx) throw new Error('usePhrases must be used within PhraseProvider');
  return ctx;
}
