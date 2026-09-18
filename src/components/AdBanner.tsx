import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet } from 'react-native';
import { apiGet } from '../api/mobileAuth';
import { BACKEND_URL } from '../config/api';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { radius, spacing } from '../theme/colors';

type AdBannerData = { id: number; imageUrl: string; linkUrl: string };

const ROTATE_INTERVAL_MS = 6000;

function resolveImageUri(url: string) {
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

// 管理画面の「広告管理」で登録したバナーを表示。有効なものが複数あれば自動でローテーション
export function AdBanner({ placement = 'home' }: { placement?: 'home' | 'talk' | 'mypage' }) {
  const [ads, setAds] = useState<AdBannerData[]>([]);
  const [index, setIndex] = useState(0);

  const load = useCallback(() => {
    apiGet<AdBannerData[]>(`/ad-banners?placement=${placement}`)
      .then(setAds)
      .catch(() => setAds([]));
  }, [placement]);

  useEffect(load, [load]);
  useLiveRefresh(load);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[index % ads.length];

  return (
    <Pressable
      style={styles.banner}
      onPress={() => {
        if (/^https?:\/\//i.test(ad.linkUrl)) Linking.openURL(ad.linkUrl).catch(() => {});
      }}
    >
      <Image source={{ uri: resolveImageUri(ad.imageUrl) }} style={styles.image} resizeMode="cover" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  image: { width: '100%', aspectRatio: 335 / 90 },
});
