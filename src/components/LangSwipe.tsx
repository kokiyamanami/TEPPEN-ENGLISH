import { ReactNode, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// デザインプロトタイプの .langswipe / .langdots の移植。
// 英文ページを横にスワイプすると日本語ページが表示され、下のEN/日本語ドットで切替もできる
export function LangSwipe({ en, jp }: { en: ReactNode; jp: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState<0 | 1>(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setPage(Math.round(e.nativeEvent.contentOffset.x / width) === 0 ? 0 : 1);
  };

  const goTo = (p: 0 | 1) => {
    setPage(p);
    scrollRef.current?.scrollTo({ x: p * width, animated: true });
  };

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
        >
          <View style={{ width }}>{en}</View>
          <View style={{ width }}>{jp}</View>
        </ScrollView>
      )}
      <View style={styles.dots}>
        <Pressable style={[styles.dot, page === 0 && styles.dotActive]} onPress={() => goTo(0)}>
          <Text style={[styles.dotText, page === 0 && styles.dotTextActive]}>EN</Text>
        </Pressable>
        <Pressable style={[styles.dot, page === 1 && styles.dotActive]} onPress={() => goTo(1)}>
          <Text style={[styles.dotText, page === 1 && styles.dotTextActive]}>日本語</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>← 横にスワイプすると日本語が表示されます →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  dot: { paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  dotActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dotText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  dotTextActive: { color: colors.white },
  hint: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
});
