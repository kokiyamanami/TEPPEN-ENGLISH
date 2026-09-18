import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiPost } from '../api/mobileAuth';
import { TtsLineButton } from '../components/TtsLineButton';
import { colors, radius, spacing } from '../theme/colors';
import { voiceForGender } from '../utils/ttsVoice';
import { usePhrases } from './PhraseContext';
import { useProfile } from './ProfileContext';

// source:'dictionary' は辞書の意味一覧（senses）、'ai' は文脈に合った意味（meaning/pos/例文）
type LookupResult = {
  source: 'dictionary' | 'ai';
  word: string;
  senses?: string[];
  pos?: string;
  meaning?: string;
  exampleEN?: string;
  exampleJP?: string;
};

type WordLookupContextValue = {
  lookup: (word: string, sentence: string) => void;
};

const WordLookupContext = createContext<WordLookupContextValue | null>(null);

// 英文中の単語を長押しした時のポップアップ。まず辞書の意味を即表示し、
// 「文脈での意味をAIで見る」を押した時だけAIで文脈に合った意味を調べる
export function WordLookupProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const { openRegister } = usePhrases();
  const [visible, setVisible] = useState(false);
  const [word, setWord] = useState('');
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const requestId = useRef(0);

  const lookup = useCallback((w: string, s: string) => {
    const id = ++requestId.current;
    setWord(w);
    setSentence(s);
    setResult(null);
    setError(false);
    setAiLoading(false);
    setLoading(true);
    setVisible(true);
    apiPost<LookupResult>('/word-lookup', { word: w, sentence: s })
      .then((r) => id === requestId.current && setResult(r))
      .catch(() => id === requestId.current && setError(true))
      .finally(() => id === requestId.current && setLoading(false));
  }, []);

  const askAi = () => {
    const id = ++requestId.current;
    setAiLoading(true);
    setError(false);
    apiPost<LookupResult>('/word-lookup', { word, sentence, mode: 'ai' })
      .then((r) => id === requestId.current && setResult(r))
      .catch(() => id === requestId.current && setError(true))
      .finally(() => id === requestId.current && setAiLoading(false));
  };

  const close = () => {
    requestId.current++;
    setVisible(false);
  };

  const register = () => {
    const text = result?.word || word;
    close();
    setTimeout(() => openRegister(text, false), 300);
  };

  return (
    <WordLookupContext.Provider value={{ lookup }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.head}>
              <Text style={styles.word}>{result?.word || word}</Text>
              <TtsLineButton text={result?.word || word} voice={voiceForGender(profile.voiceGender)} style={styles.roundBtn} />
              <Pressable style={styles.closeBtn} onPress={close} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {(loading || aiLoading) && <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.coral} />}
            {error && <Text style={styles.errorText}>意味を取得できませんでした。通信状況を確認してもう一度お試しください。</Text>}

            {result && !aiLoading && (
              <ScrollView style={styles.body}>
                {result.source === 'dictionary' ? (
                  <>
                    {result.senses?.map((s, i) => (
                      <Text key={i} style={styles.sense}>
                        {result.senses!.length > 1 ? `${i + 1}. ` : ''}
                        {s}
                      </Text>
                    ))}
                    <Pressable style={styles.aiBtn} onPress={askAi}>
                      <Ionicons name="sparkles-outline" size={14} color={colors.coral} />
                      <Text style={styles.aiBtnText}>この文脈での意味をAIで見る</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {!!result.pos && <Text style={styles.pos}>{result.pos}</Text>}
                    <Text style={styles.meaning}>{result.meaning}</Text>
                    {!!result.exampleEN && (
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleEN}>{result.exampleEN}</Text>
                        <Text style={styles.exampleJP}>{result.exampleJP}</Text>
                      </View>
                    )}
                    <Text style={styles.aiNote}>AIによる文脈に合わせた意味です</Text>
                  </>
                )}
                <Pressable style={styles.registerBtn} onPress={register}>
                  <Ionicons name="bookmark-outline" size={14} color={colors.coral} />
                  <Text style={styles.registerText}>MYフレーズに登録する</Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </WordLookupContext.Provider>
  );
}

export function useWordLookup() {
  const ctx = useContext(WordLookupContext);
  if (!ctx) throw new Error('useWordLookup must be used within WordLookupProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '75%' },
  body: { flexGrow: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  roundBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { padding: 2 },
  sense: { fontSize: 14, color: colors.textPrimary, lineHeight: 21, marginTop: spacing.xs },
  pos: { fontSize: 11, color: colors.coral, fontWeight: '700', marginTop: spacing.sm },
  meaning: { fontSize: 15, color: colors.textPrimary, marginTop: spacing.xs, lineHeight: 22 },
  exampleBox: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.md, gap: 2 },
  exampleEN: { fontSize: 12, color: colors.textPrimary, lineHeight: 18 },
  exampleJP: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  aiNote: { fontSize: 10, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { fontSize: 12, color: colors.danger, marginTop: spacing.md },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', marginTop: spacing.md, borderWidth: 1, borderColor: colors.coral, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md },
  aiBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  registerBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', marginTop: spacing.md },
  registerText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
});
