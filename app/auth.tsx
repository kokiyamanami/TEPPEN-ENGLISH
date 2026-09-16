import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../src/theme/colors';

type AuthTab = 'login' | 'signup';

// screen key: auth
export default function AuthScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<AuthTab>(params.tab === 'login' ? 'login' : 'signup');

  const isSignup = tab === 'signup';

  const onSubmit = () => {
    if (isSignup) {
      router.push('/ob1');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.mark}>⛰️</Text>
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

        <Field label="メールアドレス" placeholder="kenta.sato@example.com" />
        <Field label="パスワード" placeholder="••••••••" secure />
        {isSignup && <Field label="パスワード（確認）" placeholder="••••••••" secure />}

        {isSignup ? (
          <Pressable style={styles.checkRow}>
            <View style={styles.checkbox} />
            <Text style={styles.checkLabel}>利用規約・プライバシーポリシーに同意する</Text>
          </Pressable>
        ) : (
          <Text style={styles.forgot}>パスワードをお忘れですか？</Text>
        )}

        <Pressable style={styles.cta} onPress={onSubmit}>
          <Text style={styles.ctaText}>{isSignup ? 'アカウントを作成' : 'ログイン'}</Text>
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

function Field({ label, placeholder, secure }: { label: string; placeholder: string; secure?: boolean }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.box}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secure}
        autoCapitalize="none"
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
  checkLabel: { fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  forgot: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: spacing.md },
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
