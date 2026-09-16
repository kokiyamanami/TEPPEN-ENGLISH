export type PhraseFolderSource = 'official' | 'custom';

export type PhraseFolderSeed = { id: string; name: string; source: PhraseFolderSource };

export const PHRASE_FOLDERS_SEED: PhraseFolderSeed[] = [
  { id: 'f1', name: '重要構文40', source: 'official' },
  { id: 'f2', name: 'お役立ちフレーズ50', source: 'official' },
  { id: 'f3', name: '商談で使える言い回し', source: 'custom' },
  { id: 'f4', name: 'プレゼン導入', source: 'custom' },
];

export type PhraseSeed = { id: string; folderId: string; text: string; textJP: string };

// TODO(Phase10): サーバー側でユーザーごとに永続化されたフレーズデータに置き換え
export const PHRASES_SEED: PhraseSeed[] = [
  { id: 'p1', folderId: 'f1', text: 'Let me walk you through the numbers.', textJP: '数字についてご説明させてください。' },
  { id: 'p2', folderId: 'f1', text: "I'd like to get your thoughts on this.", textJP: 'これについてご意見をいただきたいです。' },
  { id: 'p3', folderId: 'f1', text: "That's a fair point.", textJP: 'それはもっともな指摘ですね。' },
  { id: 'p4', folderId: 'f2', text: 'Could you elaborate on that?', textJP: 'もう少し詳しく教えていただけますか？' },
  { id: 'p5', folderId: 'f2', text: "Let's circle back on this later.", textJP: 'この件は後で改めて話しましょう。' },
  { id: 'p6', folderId: 'f3', text: 'We can offer more flexible terms.', textJP: 'より柔軟な条件を提示できます。' },
  { id: 'p7', folderId: 'f3', text: 'Let me confirm internally and get back to you.', textJP: '社内で確認して折り返します。' },
  { id: 'p8', folderId: 'f4', text: 'Thank you for making time for this today.', textJP: '本日はお時間をいただきありがとうございます。' },
];
