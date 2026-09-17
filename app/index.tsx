import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../src/components/BrandLogo';
import { useProfile } from '../src/store/ProfileContext';
import { useSession } from '../src/store/SessionContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: splash
export default function SplashScreen() {
  const { isAuthenticated, loading } = useSession();
  const { loadProfile } = useProfile();
  const [resuming, setResuming] = useState(true);
  // このSplashはauth/ob1などがpushされた後も裏でマウントされたままになるため、
  // サインアップ等でisAuthenticatedが後から変化しても再度反応しないよう、
  // アプリ起動直後の一度きりのセッション復元チェックに限定する
  const checkedRef = useRef(false);

  useEffect(() => {
    if (loading || checkedRef.current) return;
    checkedRef.current = true;
    if (!isAuthenticated) {
      setResuming(false);
      return;
    }
    loadProfile()
      .then(() => router.replace('/(tabs)/home'))
      .catch(() => setResuming(false));
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (resuming) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BrandLogo width={180} />
      <Text style={styles.title}>コーチング型 英語学習</Text>
      <Text style={styles.subtitle}>
        プロフィールに合わせてAIが教材を作る、{'\n'}登頂型の英語トレーニング。
      </Text>
      <View style={styles.ctaGroup}>
        <Pressable style={styles.cta} onPress={() => router.push('/auth?tab=signup')}>
          <Text style={styles.ctaText}>はじめる</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/auth?tab=login')}>
          <Text style={styles.ghostText}>
            すでにアカウントをお持ちの方は<Text style={styles.ghostBold}>ログイン</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mark: { fontSize: 48 },
  title: { color: colors.white, fontSize: 19, fontWeight: '700', marginTop: spacing.lg },
  subtitle: {
    color: colors.coralLight,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaGroup: { width: '100%', marginTop: spacing.xl, gap: spacing.md },
  cta: {
    backgroundColor: colors.coral,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  ghostText: { color: colors.white, fontSize: 12, textAlign: 'center', opacity: 0.85 },
  ghostBold: { fontWeight: '700' },
});
