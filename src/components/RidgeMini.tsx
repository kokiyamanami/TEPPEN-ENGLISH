import Svg, { Defs, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

const RIDGE_POINTS = '0,90 40,55 80,70 120,30 160,50 200,15 240,45 280,25 320,60 350,40 350,90';
const RIDGE_LINE = '0,90 40,55 80,70 120,30 160,50 200,15 240,45 280,25 320,60 350,40';

// ホームの標高カード背景に敷く簡易的な稜線シルエット（プロトタイプのridgeSVG相当）
export function RidgeMini() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 350 90" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1D4A73" />
          <Stop offset="100%" stopColor="#0B2338" />
        </LinearGradient>
      </Defs>
      <Polygon points={RIDGE_POINTS} fill="url(#ridgeGrad)" opacity={0.9} />
      <Polyline points={RIDGE_LINE} fill="none" stroke="#E8825F" strokeWidth={2} opacity={0.85} />
    </Svg>
  );
}
