import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BrandLogo } from '../src/components/BrandLogo';
import { useProfile } from '../src/store/ProfileContext';
import { useSession } from '../src/store/SessionContext';
import { colors, radius, spacing } from '../src/theme/colors';

type AuthTab = 'login' | 'signup';

// screen key: auth
export default function AuthScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<AuthTab>(params.tab === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signup, login } = useSession();
  const { loadProfile } = useProfile();

  const isSignup = tab === 'signup';

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (isSignup && !agreed) {
      setError('利用規約・プライバシーポリシーへの同意が必要です');
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email.trim(), password);
        router.push('/ob1');
      } else {
        await login(email.trim(), password);
        await loadProfile();
        router.replace('/(tabs)/home');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '通信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandLogo width={140} contained />
        <Text style={styles.title}>{isSignup ? 'はじめまして' : 'おかえりなさい'}</Text>
        <Text style={styles.sub}>
          {isSignup ? 'アカウントを作成して、登頂を始めましょう' : 'ログインして続きから登りましょう'}
        </Text>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, !isSignup && styles.tabActive]} onPress={() => setTab('login')}>
            <Text style={[styles.tabText, !isSignup && styles.tabTextActive]}>ログイン</Text>
          </Pressable>
          <Pressable style={[styles.tab, isSignup && styles.tabActive]} onPress={() => setTab('signup')}>
            <Text style={[styles.tabText, isSignup && styles.tabTextActive]}>新規登録</Text>
          </Pressable>
        </View>

        <Field label="メールアドレス" placeholder="kenta.sato@example.com" value={email} onChangeText={setEmail} />
        <Field label="パスワード" placeholder="••••••••" secure value={password} onChangeText={setPassword} />
        {isSignup && (
          <Field label="パスワード（確認）" placeholder="••••••••" secure value={confirmPassword} onChangeText={setConfirmPassword} />
        )}

        {isSignup ? (
          <Pressable style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
            <Text style={styles.checkLabel}>利用規約・プライバシーポリシーに同意する</Text>
          </Pressable>
        ) : (
          <Text style={styles.forgot}>パスワードをお忘れですか？</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.cta} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaText}>{isSignup ? 'アカウントを作成' : 'ログイン'}</Text>}
        </Pressable>

        <Text style={styles.switchText}>
          {isSignup ? 'すでにアカウントをお持ちの方は ' : 'はじめて利用する方は '}
          <Text style={styles.switchLink} onPress={() => setTab(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'ログイン' : '新規登録'}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  secure,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  secure?: boolean;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.box}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secure}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, alignItems: 'stretch' },
  mark: { fontSize: 40, textAlign: 'center', marginTop: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.lg,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.navy },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  fieldBlock: { marginTop: spacing.md },
  fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  box: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  checkboxChecked: { backgroundColor: colors.coral, borderColor: colors.coral },
  checkLabel: { fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  forgot: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.md },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
  cta: {
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', fontSize: 13, color: colors.textSecondary, marginTop: spacing.lg },
  switchLink: { color: colors.navy, fontWeight: '700' },
});
