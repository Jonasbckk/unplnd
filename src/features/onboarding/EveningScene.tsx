import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

export type SceneName = 'sunset' | 'decide' | 'route';

/**
 * Warm, minimal vector scenes for onboarding — illustration style per 48_BRAND_GUIDELINES
 * (organic, rounded, warm; never stock, never cartoonish). Theme-aware for dark mode.
 */
export function EveningScene({ name, width = 300 }: { name: SceneName; width?: number }) {
  const t = useTheme();
  const dark = t.scheme === 'dark';
  const height = width * 0.66;

  // Shared palette
  const sun = '#E88C5A';
  const sunGlow = dark ? 'rgba(232,140,90,0.18)' : 'rgba(232,140,90,0.25)';
  const hillFar = dark ? '#2A2522' : '#E7D3C8';
  const hillNear = dark ? '#211D1A' : '#D9BFAF';
  const skyline = dark ? '#403833' : '#B98F79';
  const muted = dark ? '#403833' : '#E7D3C8';
  const mutedText = dark ? '#6B5F57' : '#B9A99D';
  const card = dark ? '#302A26' : '#FFFFFF';
  const primary = t.colors.primary;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 300 200">
        {name === 'sunset' && (
          <G>
            {/* glowing sun over soft hills */}
            <Circle cx={150} cy={92} r={64} fill={sunGlow} />
            <Circle cx={150} cy={92} r={44} fill={sunGlow} />
            <Circle cx={150} cy={92} r={28} fill={sun} />
            {/* stars */}
            <Circle cx={52} cy={38} r={2.5} fill={sun} opacity={0.7} />
            <Circle cx={244} cy={30} r={2} fill={sun} opacity={0.5} />
            <Circle cx={210} cy={54} r={1.6} fill={sun} opacity={0.6} />
            {/* skyline silhouette */}
            <Rect x={38} y={104} width={16} height={44} rx={5} fill={skyline} />
            <Rect x={60} y={90} width={20} height={58} rx={6} fill={skyline} opacity={0.85} />
            <Rect x={222} y={98} width={18} height={50} rx={6} fill={skyline} opacity={0.9} />
            <Rect x={246} y={112} width={14} height={36} rx={5} fill={skyline} opacity={0.75} />
            {/* hills */}
            <Path d="M0 156 Q 75 120 150 150 T 300 146 L 300 200 L 0 200 Z" fill={hillFar} />
            <Path d="M0 176 Q 100 148 190 172 T 300 170 L 300 200 L 0 200 Z" fill={hillNear} />
            {/* two tiny people watching */}
            <Circle cx={142} cy={158} r={5} fill={primary} />
            <Rect x={138} y={163} width={8} height={13} rx={4} fill={primary} />
            <Circle cx={158} cy={158} r={5} fill={sun} />
            <Rect x={154} y={163} width={8} height={13} rx={4} fill={sun} />
          </G>
        )}

        {name === 'decide' && (
          <G>
            {/* endless group-chat bubbles, muted */}
            <Rect x={26} y={30} width={104} height={26} rx={13} fill={muted} />
            <Circle cx={50} cy={43} r={3} fill={mutedText} />
            <Circle cx={64} cy={43} r={3} fill={mutedText} />
            <Circle cx={78} cy={43} r={3} fill={mutedText} />
            <Rect x={44} y={64} width={86} height={26} rx={13} fill={muted} opacity={0.8} />
            <Circle cx={66} cy={77} r={3} fill={mutedText} />
            <Circle cx={80} cy={77} r={3} fill={mutedText} />
            <Rect x={26} y={98} width={96} height={26} rx={13} fill={muted} opacity={0.6} />
            <Circle cx={48} cy={111} r={3} fill={mutedText} />
            <Circle cx={62} cy={111} r={3} fill={mutedText} />
            <Circle cx={76} cy={111} r={3} fill={mutedText} />
            {/* the one warm answer */}
            <Rect x={158} y={56} width={118} height={78} rx={20} fill={card} />
            <Rect x={158} y={56} width={118} height={78} rx={20} fill={sunGlow} />
            <Circle cx={182} cy={82} r={9} fill={primary} />
            <Path d="M178 82 l3 3 l6 -6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Rect x={200} y={76} width={58} height={7} rx={3.5} fill={primary} opacity={0.9} />
            <Rect x={200} y={90} width={40} height={6} rx={3} fill={mutedText} />
            <Rect x={176} y={108} width={82} height={12} rx={6} fill={primary} />
            {/* spark */}
            <Path d="M150 40 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4 Z" fill={sun} opacity={0.9} />
          </G>
        )}

        {name === 'route' && (
          <G>
            {/* a curved evening route with glowing stops, ending in a memory */}
            <Path
              d="M40 160 C 90 150 96 104 140 100 S 216 118 236 66"
              stroke={primary}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="1 12"
              fill="none"
              opacity={0.9}
            />
            <Circle cx={40} cy={160} r={11} fill={primary} />
            <Circle cx={40} cy={160} r={4.5} fill="#FFFFFF" />
            <Circle cx={140} cy={100} r={11} fill={sun} />
            <Circle cx={140} cy={100} r={4.5} fill="#FFFFFF" />
            {/* final stop: a polaroid memory */}
            <G transform="rotate(8 236 52)">
              <Rect x={210} y={26} width={56} height={62} rx={6} fill={card} />
              <Rect x={216} y={32} width={44} height={38} rx={4} fill={sunGlow} />
              <Circle cx={230} cy={46} r={7} fill={sun} />
              <Path d="M216 66 Q 230 52 244 62 T 260 60 L 260 70 L 216 70 Z" fill={hillNear} />
            </G>
            <Circle cx={236} cy={66} r={6} fill={primary} />
            {/* small heart */}
            <Path
              d="M70 66 c 0 -6 9 -8 11 -2 c 2 -6 11 -4 11 2 c 0 6 -8 10 -11 13 c -3 -3 -11 -7 -11 -13 Z"
              fill={sun}
              opacity={0.85}
            />
          </G>
        )}
      </Svg>
    </View>
  );
}
