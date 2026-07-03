import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export interface LogoProps {
  /** Visible size of the brand mark (the transparent padding is cropped out). */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// The source PNG is a square with the mark occupying ~34% of it (transparent padding around).
const SOURCE = require('@/assets/brand/logo-mark.png');
const CONTENT_RATIO = 0.34;

/** UNPLND brand mark (the smile). Works on light & dark backgrounds. */
export function Logo({ size = 32, style }: LogoProps) {
  const inner = size / CONTENT_RATIO;
  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      <Image source={SOURCE} style={{ width: inner, height: inner }} contentFit="contain" />
    </View>
  );
}
