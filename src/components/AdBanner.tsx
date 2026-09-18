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
  const [ratios, setRatios] = useState<Record<number, number>>({});

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

  const ad = ads.length ? ads[index % ads.length] : null;

  // 画像の縦横比のまま表示する（固定比率でcoverすると、縦長のバナーは上下が切れてしまう）
  useEffect(() => {
    if (!ad || ratios[ad.id]) return;
    Image.getSize(
      resolveImageUri(ad.imageUrl),
      (w, h) => h > 0 && setRatios((r) => ({ ...r, [ad.id]: Math.min(4, Math.max(1, w / h)) })),
      () => {}
    );
  }, [ad, ratios]);

  if (!ad) return null;

  return (
    <Pressable
      style={styles.banner}
      onPress={() => {
        if (/^https?:\/\//i.test(ad.linkUrl)) Linking.openURL(ad.linkUrl).catch(() => {});
      }}
    >
      <Image source={{ uri: resolveImageUri(ad.imageUrl) }} style={[styles.image, { aspectRatio: ratios[ad.id] ?? 335 / 90 }]} resizeMode="cover" />
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
  image: { width: '100%' },
});
