import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { BACKEND_URL } from '../config/api';
import { ASCENT_MILESTONES, ASCENT_PATH, ASCENT_SUMMIT_M, pointAlongAscentPath } from '../data/mockHome';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function AscentScene({ altitudeM }: { altitudeM: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pct = Math.min(1, altitudeM / ASCENT_SUMMIT_M);
  const marker = pointAlongAscentPath(pct);
  const pathD = `M ${ASCENT_PATH.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const nextMilestone = ASCENT_MILESTONES.find((m) => m.altitudeM > altitudeM);

  const haloRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [10, 18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  // 各マイルストーンの座標・サイズ・状態を一度だけ計算し、clipPath/画像/リングの3レイヤーで共有する
  const milestoneDots = ASCENT_MILESTONES.map((m) => {
    const t = Math.min(1, m.altitudeM / ASCENT_SUMMIT_M);
    const p = pointAlongAscentPath(t);
    const done = altitudeM >= m.altitudeM;
    const isCurrent = nextMilestone?.order === m.order;
    const r = isCurrent ? 16 : done ? 13 : 10;
    return { m, p, done, isCurrent, r };
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

      <AnimatedCircle cx={marker.x} cy={marker.y} r={haloRadius} fill="#E8825F" opacity={haloOpacity} />
      <Circle cx={marker.x} cy={marker.y} r={8} fill="#E8825F" stroke="#FFFFFF" strokeWidth={2} />
    </Svg>
  );
}
