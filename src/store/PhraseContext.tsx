import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/mobileAuth';
import { useSession } from './SessionContext';

// curated=カスタマイズ教材（プロフィール連動）、official=運営提供（レベル別）、custom=マイフォルダ（自由に編集可）
export type PhraseFolderSource = 'curated' | 'official' | 'custom';
export type PhraseContentType = 'phrase' | 'word';
export type PhraseFolder = { id: number; name: string; source: PhraseFolderSource; content_type: PhraseContentType };
export type Phrase = { id: number; folder_id: number; text: string; text_jp: string; learned: number };

type RegisterState = { visible: boolean; text: string; textJP: string; editable: boolean; folderId: number | null; editId: number | null; contentType: PhraseContentType };

type PhraseContextValue = {
  folders: PhraseFolder[];
  phrases: Phrase[];
  reload: () => Promise<void>;
  folderCount: (folderId: number) => number;
  addFolder: (name: string, contentType?: PhraseContentType) => Promise<number>;
  deleteFolder: (id: number) => void;
  renameFolder: (id: number, name: string) => void;
  deletePhrase: (id: number) => void;
  toggleLearned: (id: number) => void;
  registerState: RegisterState;
  openRegister: (text: string, editable: boolean, folderId?: number | null, textJP?: string, contentType?: PhraseContentType) => void;
  setRegisterType: (t: PhraseContentType) => void;
  openEdit: (phrase: Phrase) => void;
  closeRegister: () => void;
  confirmRegister: (text: string, folderId: number, textJP: string) => void;
};

const PhraseContext = createContext<PhraseContextValue | null>(null);

export function PhraseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [folders, setFolders] = useState<PhraseFolder[]>([]);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [registerState, setRegisterState] = useState<RegisterState>({
    visible: false,
    text: '',
    textJP: '',
    editable: true,
    folderId: null,
    editId: null,
    contentType: 'phrase',
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

  const addFolder = async (name: string, contentType: PhraseContentType = 'phrase') => {
    const res = await apiPost<{ id: number }>('/phrase-folders', { name, contentType });
    setFolders((prev) => [...prev, { id: res.id, name, source: 'custom', content_type: contentType }]);
    return res.id;
  };

  const deleteFolder = async (id: number) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setPhrases((prev) => prev.filter((p) => p.folder_id !== id));
    await apiDelete(`/phrase-folders/${id}`).catch(() => load().catch(() => {}));
  };

  const renameFolder = async (id: number, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    await apiPatch(`/phrase-folders/${id}`, { name }).catch(() => load().catch(() => {}));
  };

  const deletePhrase = async (id: number) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
    await apiDelete(`/phrases/${id}`).catch(() => load().catch(() => {}));
  };

  const toggleLearned = async (id: number) => {
    const target = phrases.find((p) => p.id === id);
    if (!target) return;
    const nextLearned = target.learned ? 0 : 1;
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, learned: nextLearned } : p)));
    await apiPatch(`/phrases/${id}`, { learned: !!nextLearned }).catch(() => load().catch(() => {}));
  };

  const firstCustomFolder = (t: PhraseContentType) => folders.find((f) => f.source === 'custom' && f.content_type === t)?.id ?? null;

  // 単語（スペースを含まない1語）は「単語」、それ以外は「フレーズ」を初期の区分にする
  const openRegister = (text: string, editable: boolean, folderId: number | null = null, textJP = '', contentType?: PhraseContentType) => {
    const type: PhraseContentType =
      (folderId !== null ? folders.find((f) => f.id === folderId)?.content_type : undefined) ??
      contentType ??
      (text.trim() && !/\s/.test(text.trim()) ? 'word' : 'phrase');
    setRegisterState({ visible: true, text, textJP, editable, folderId: folderId ?? firstCustomFolder(type), editId: null, contentType: type });
  };

  const setRegisterType = (t: PhraseContentType) => setRegisterState((prev) => ({ ...prev, contentType: t, folderId: firstCustomFolder(t) }));

  const openEdit = (p: Phrase) => {
    const type = folders.find((f) => f.id === p.folder_id)?.content_type ?? 'phrase';
    setRegisterState({ visible: true, text: p.text, textJP: p.text_jp, editable: true, folderId: p.folder_id, editId: p.id, contentType: type });
  };

  const closeRegister = () => setRegisterState((prev) => ({ ...prev, visible: false }));

  const confirmRegister = async (text: string, folderId: number, textJP: string) => {
    const editId = registerState.editId;
    setRegisterState((prev) => ({ ...prev, visible: false }));
    try {
      if (editId !== null) {
        await apiPatch(`/phrases/${editId}`, { text, textJP, folderId });
        setPhrases((prev) => prev.map((p) => (p.id === editId ? { ...p, text, text_jp: textJP, folder_id: folderId } : p)));
      } else {
        const res = await apiPost<{ id: number }>('/phrases', { folderId, text, textJP });
        setPhrases((prev) => [...prev, { id: res.id, folder_id: folderId, text, text_jp: textJP, learned: 0 }]);
      }
    } catch {
      // 登録に失敗した場合は一覧を変更しない（未捕捉のPromise rejectionを避ける）
    }
  };

  const value = useMemo(
    () => ({ folders, phrases, reload: load, folderCount, addFolder, deleteFolder, renameFolder, deletePhrase, toggleLearned, registerState, openRegister, setRegisterType, openEdit, closeRegister, confirmRegister }),
    [folders, phrases, registerState]
  );

  return <PhraseContext.Provider value={value}>{children}</PhraseContext.Provider>;
}

export function usePhrases() {
  const ctx = useContext(PhraseContext);
  if (!ctx) throw new Error('usePhrases must be used within PhraseProvider');
  return ctx;
}
