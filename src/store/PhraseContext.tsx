import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/mobileAuth';
import { useSession } from './SessionContext';

export type PhraseFolderSource = 'official' | 'custom';
export type PhraseFolder = { id: number; name: string; source: PhraseFolderSource };
export type Phrase = { id: number; folder_id: number; text: string; text_jp: string; learned: number };

type RegisterState = { visible: boolean; text: string; editable: boolean; folderId: number | null };

type PhraseContextValue = {
  folders: PhraseFolder[];
  phrases: Phrase[];
  folderCount: (folderId: number) => number;
  addFolder: (name: string) => Promise<number>;
  deleteFolder: (id: number) => void;
  toggleLearned: (id: number) => void;
  registerState: RegisterState;
  openRegister: (text: string, editable: boolean, folderId?: number | null) => void;
  closeRegister: () => void;
  confirmRegister: (text: string, folderId: number) => void;
};

const PhraseContext = createContext<PhraseContextValue | null>(null);

export function PhraseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [folders, setFolders] = useState<PhraseFolder[]>([]);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [registerState, setRegisterState] = useState<RegisterState>({
    visible: false,
    text: '',
    editable: true,
    folderId: null,
  });

  const load = async () => {
    const [f, p] = await Promise.all([apiGet<PhraseFolder[]>('/phrase-folders'), apiGet<Phrase[]>('/phrases')]);
    setFolders(f);
    setPhrases(p);
  };

  useEffect(() => {
    if (isAuthenticated) {
      load().catch(() => {});
    } else {
      setFolders([]);
      setPhrases([]);
    }
  }, [isAuthenticated]);

  const folderCount = (folderId: number) => phrases.filter((p) => p.folder_id === folderId).length;

  const addFolder = async (name: string) => {
    const res = await apiPost<{ id: number }>('/phrase-folders', { name });
    setFolders((prev) => [...prev, { id: res.id, name, source: 'custom' }]);
    return res.id;
  };

  const deleteFolder = async (id: number) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setPhrases((prev) => prev.filter((p) => p.folder_id !== id));
    await apiDelete(`/phrase-folders/${id}`).catch(() => load().catch(() => {}));
  };

  const toggleLearned = async (id: number) => {
    const target = phrases.find((p) => p.id === id);
    if (!target) return;
    const nextLearned = target.learned ? 0 : 1;
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, learned: nextLearned } : p)));
    await apiPatch(`/phrases/${id}`, { learned: !!nextLearned }).catch(() => load().catch(() => {}));
  };

  const openRegister = (text: string, editable: boolean, folderId: number | null = null) => {
    setRegisterState({ visible: true, text, editable, folderId: folderId ?? folders[0]?.id ?? null });
  };

  const closeRegister = () => setRegisterState((prev) => ({ ...prev, visible: false }));

  const confirmRegister = async (text: string, folderId: number) => {
    setRegisterState((prev) => ({ ...prev, visible: false }));
    try {
      const res = await apiPost<{ id: number }>('/phrases', { folderId, text, textJP: '' });
      setPhrases((prev) => [...prev, { id: res.id, folder_id: folderId, text, text_jp: '', learned: 0 }]);
    } catch {
      // 登録に失敗した場合は一覧に追加しない（未捕捉のPromise rejectionを避ける）
    }
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
