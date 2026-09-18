import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ノッチ／ダイナミックアイランド分の上余白。safe-areaの値が小さく返る端末でも、
// ステータスバーの高さ以上は必ず確保して、時刻などと見出しが重ならないようにする
export function useTopInset() {
  const { top } = useSafeAreaInsets();
  return Math.max(top, Constants.statusBarHeight ?? 0);
}
