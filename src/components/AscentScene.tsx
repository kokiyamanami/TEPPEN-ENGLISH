import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Image as SvgImage,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { BACKEND_URL } from '../config/api';
import { ASCENT_MILESTONES, ASCENT_PATH, ASCENT_SUMMIT_M, pointAlongAscentPath } from '../data/mockHome';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// 夜空を寂しくしないための固定の星（毎回同じ位置。山の稜線より上のy<145にのみ配置）
const STARS = [
  { x: 18, y: 28, r: 1.4 }, { x: 44, y: 62, r: 1 }, { x: 76, y: 22, r: 1.6 }, { x: 102, y: 48, r: 1 },
  { x: 132, y: 18, r: 1.2 }, { x: 160, y: 55, r: 1.5 }, { x: 190, y: 30, r: 1 }, { x: 222, y: 20, r: 1.3 },
  { x: 244, y: 68, r: 1 }, { x: 30, y: 95, r: 1.1 }, { x: 90, y: 88, r: 0.9 }, { x: 148, y: 92, r: 1 },
  { x: 205, y: 100, r: 1.2 }, { x: 12, y: 130, r: 0.9 }, { x: 236, y: 118, r: 1 }, { x: 172, y: 130, r: 0.8 },
];

export function AscentScene({ altitudeM }: { altitudeM: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: false }),
      ])
    );
    loop.start();
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(twinkle, { toValue: 0, duration: 1600, useNativeDriver: false }),
      ])
    );
    twinkleLoop.start();
    return () => {
      loop.stop();
      twinkleLoop.stop();
    };
  }, [pulse, twinkle]);

  const pct = Math.min(1, altitudeM / ASCENT_SUMMIT_M);
  const marker = pointAlongAscentPath(pct);
  const pathD = `M ${ASCENT_PATH.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const nextMilestone = ASCENT_MILESTONES.find((m) => m.altitudeM > altitudeM);

  const haloRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [10, 18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
  const starOpacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // 各マイルストーンの座標・サイズ・状態を一度だけ計算し、clipPath/画像/リング/ラベルの各レイヤーで共有する
  const milestoneDots = ASCENT_MILESTONES.map((m, i) => {
    const t = Math.min(1, m.altitudeM / ASCENT_SUMMIT_M);
    const p = pointAlongAscentPath(t);
    const done = altitudeM >= m.altitudeM;
    const isCurrent = nextMilestone?.order === m.order;
    const r = isCurrent ? 16 : done ? 13 : 10;
    const labelRight = i % 2 === 0;
    return { m, p, done, isCurrent, r, labelRight };
  });

  return (
    <Svg viewBox="0 0 260 420" style={{ width: '100%', aspectRatio: 260 / 420 }}>
      <Defs>
        <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2B5C87" />
          <Stop offset="100%" stopColor="#0B2338" />
        </LinearGradient>
        {milestoneDots.map(({ m, p, r }) => (
          <ClipPath id={`milestone-clip-${m.order}`} key={m.order}>
            <Circle cx={p.x} cy={p.y} r={r} />
          </ClipPath>
        ))}
      </Defs>
      <Rect x={0} y={0} width={260} height={420} fill="url(#skyGrad)" />

      {STARS.map((s, i) => (
        <AnimatedCircle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={i % 3 === 0 ? starOpacity : 0.55} />
      ))}

      <Polygon points="0,420 0,300 60,190 110,260 150,150 200,240 260,180 260,420" fill="#14365A" opacity={0.55} />
      <Polygon points="0,420 20,340 80,250 130,320 170,220 220,300 260,250 260,420" fill="#0F2A45" opacity={0.85} />
      <Path d={pathD} fill="none" stroke="#E8825F" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 9" opacity={0.8} />

      {milestoneDots.map(({ m, p, r, done, isCurrent }) => (
        <SvgImage
          key={m.order}
          href={{ uri: `${BACKEND_URL}${m.image}` }}
          x={p.x - r}
          y={p.y - r}
          width={r * 2}
          height={r * 2}
          opacity={done || isCurrent ? 1 : 0.4}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#milestone-clip-${m.order})`}
        />
      ))}

      {milestoneDots.map(({ m, p, r, done, isCurrent }) => (
        <Circle
          key={`ring-${m.order}`}
          cx={p.x}
          cy={p.y}
          r={r}
          fill="none"
          stroke={isCurrent ? '#FFFFFF' : done ? '#E8825F' : 'rgba(255,255,255,0.35)'}
          strokeWidth={isCurrent ? 2.5 : 1.5}
        />
      ))}

      {milestoneDots
        .filter(({ done, isCurrent }) => done || isCurrent)
        .map(({ m, p, r, isCurrent, labelRight }) => {
          const textWidth = m.name.length * 6.4 + 8;
          const tx = labelRight ? p.x + r + 4 : p.x - r - 4 - textWidth;
          return (
            <Rect
              key={`label-bg-${m.order}`}
              x={tx}
              y={p.y - 7}
              width={textWidth}
              height={14}
              rx={7}
              fill={isCurrent ? 'rgba(232,130,95,0.85)' : 'rgba(11,35,56,0.7)'}
            />
          );
        })}
      {milestoneDots
        .filter(({ done, isCurrent }) => done || isCurrent)
        .map(({ m, p, r, isCurrent, labelRight }) => {
          const textWidth = m.name.length * 6.4 + 8;
          const tx = labelRight ? p.x + r + 4 : p.x - r - 4 - textWidth;
          return (
            <SvgText key={`label-${m.order}`} x={tx + textWidth / 2} y={p.y + 3.5} fontSize={9} fill="#FFFFFF" textAnchor="middle">
              {isCurrent ? `次：${m.name}` : m.name}
            </SvgText>
          );
        })}

      <AnimatedCircle cx={marker.x} cy={marker.y} r={haloRadius} fill="#E8825F" opacity={haloOpacity} />
      <Circle cx={marker.x} cy={marker.y} r={8} fill="#E8825F" stroke="#FFFFFF" strokeWidth={2} />
    </Svg>
  );
}
