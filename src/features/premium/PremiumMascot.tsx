import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/**
 * The UNPLND mascot as a glossy "3D render" — the brand smile hovering over a dark
 * podium with a warm rim light (paywall hero, per the founder's mockup). Pure vector:
 * crisp on every screen, works in light & dark, no asset pipeline. The mascot keeps
 * the fixed logo oranges (it IS the logo), independent of the user's app theme.
 * Gently floats (Reduce Motion → still).
 */
export function PremiumMascot({ size = 132 }: { size?: number }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    float.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduced, float]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value * 5 }] }));

  // Base design is 150 wide × 176 tall; everything scales from `size`.
  const w = size;
  const h = (size * 176) / 150;
  const mascotH = (size * 148) / 150;
  const podiumH = (size * 50) / 150;

  return (
    <View style={{ width: w, height: h }}>
      {/* Podium — pinned to the ground, does not float. */}
      <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Svg width={w} height={podiumH} viewBox="0 0 150 50">
          <Defs>
            <RadialGradient id="mGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F2762E" stopOpacity={0.32} />
              <Stop offset="70%" stopColor="#F2762E" stopOpacity={0.1} />
              <Stop offset="100%" stopColor="#F2762E" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="mSide" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#211C18" />
              <Stop offset="100%" stopColor="#0E0C0A" />
            </LinearGradient>
            <LinearGradient id="mRim" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#FF9D45" stopOpacity={0.9} />
              <Stop offset="50%" stopColor="#F2762E" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#FF9D45" stopOpacity={0.9} />
            </LinearGradient>
          </Defs>
          {/* Warm ground glow */}
          <Ellipse cx={75} cy={26} rx={72} ry={20} fill="url(#mGlow)" />
          {/* Cylinder: bottom ellipse + side wall + top face */}
          <Ellipse cx={75} cy={32} rx={58} ry={12} fill="#0E0C0A" />
          <Path d="M17,20 L17,32 A58,12 0 0 0 133,32 L133,20 Z" fill="url(#mSide)" />
          <Ellipse cx={75} cy={20} rx={58} ry={12} fill="#28221D" />
          <Ellipse cx={75} cy={20} rx={58} ry={12} fill="none" stroke="url(#mRim)" strokeWidth={1.6} />
          {/* Contact shadow under the hovering mascot */}
          <Ellipse cx={75} cy={18} rx={30} ry={5.5} fill="#000000" opacity={0.32} />
        </Svg>
      </View>

      {/* Mascot — hovers above the podium. */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, floatStyle]}>
        <Svg width={w} height={mascotH} viewBox="0 0 150 148">
          <Defs>
            <LinearGradient id="mU" x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0%" stopColor="#FFA24D" />
              <Stop offset="55%" stopColor="#F2762E" />
              <Stop offset="100%" stopColor="#D9481F" />
            </LinearGradient>
            <RadialGradient id="mEyeL" cx="35%" cy="30%" r="75%">
              <Stop offset="0%" stopColor="#FF9A6B" />
              <Stop offset="60%" stopColor="#E8542C" />
              <Stop offset="100%" stopColor="#B93318" />
            </RadialGradient>
            <RadialGradient id="mEyeR" cx="35%" cy="30%" r="75%">
              <Stop offset="0%" stopColor="#FFC08A" />
              <Stop offset="60%" stopColor="#F2762E" />
              <Stop offset="100%" stopColor="#C74A1C" />
            </RadialGradient>
          </Defs>
          {/* The U — thick rounded smile with a soft specular streak */}
          <Path
            d="M45,52 L45,78 A30,30 0 0 0 105,78 L105,52"
            fill="none"
            stroke="url(#mU)"
            strokeWidth={30}
            strokeLinecap="round"
          />
          <Path
            d="M38,54 L38,78 A37,37 0 0 0 50,105"
            fill="none"
            stroke="#FFDCB2"
            strokeOpacity={0.4}
            strokeWidth={6}
            strokeLinecap="round"
          />
          {/* Eyes — glossy spheres floating above the smile, specular highlights */}
          <Circle cx={45} cy={14} r={13} fill="url(#mEyeL)" />
          <Circle cx={40.5} cy={9.5} r={4} fill="#FFFFFF" opacity={0.75} />
          <Circle cx={105} cy={14} r={13} fill="url(#mEyeR)" />
          <Circle cx={100.5} cy={9.5} r={4} fill="#FFFFFF" opacity={0.75} />
        </Svg>
      </Animated.View>
    </View>
  );
}
