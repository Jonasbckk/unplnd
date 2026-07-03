import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export interface SliderStep {
  value: string;
  label: string;
}

interface StepSliderProps {
  steps: SliderStep[];
  index: number;
  onChange: (index: number) => void;
}

const THUMB = 30;
const TRACK_H = 6;
const SPRING = { damping: 16, stiffness: 220, mass: 0.6 };

/** A premium stepped slider — drag or tap, with a haptic detent at each step (18_PLANNER). */
export function StepSlider({ steps, index, onChange }: StepSliderProps) {
  const t = useTheme();
  const n = steps.length;
  const [trackW, setTrackW] = useState(0);
  const trackWSV = useSharedValue(0);
  const progress = useSharedValue(n > 1 ? index / (n - 1) : 0);
  const lastIdx = useSharedValue(index);

  const travel = Math.max(trackW - THUMB, 0);

  const commit = (i: number) => {
    haptics.selection();
    onChange(i);
  };

  const fractionAt = (x: number) => {
    'worklet';
    const t2 = trackWSV.value - THUMB;
    if (t2 <= 0) return 0;
    return Math.min(Math.max((x - THUMB / 2) / t2, 0), 1);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      const f = fractionAt(e.x);
      progress.value = f;
      const i = Math.round(f * (n - 1));
      if (i !== lastIdx.value) {
        lastIdx.value = i;
        runOnJS(commit)(i);
      }
    })
    .onEnd(() => {
      'worklet';
      progress.value = withSpring(n > 1 ? lastIdx.value / (n - 1) : 0, SPRING);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const i = Math.round(fractionAt(e.x) * (n - 1));
    progress.value = withSpring(n > 1 ? i / (n - 1) : 0, SPRING);
    if (i !== lastIdx.value) {
      lastIdx.value = i;
      runOnJS(commit)(i);
    }
  });

  const gesture = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * Math.max(trackWSV.value - THUMB, 0) }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: progress.value * Math.max(trackWSV.value - THUMB, 0) + THUMB / 2,
  }));

  return (
    <View style={{ gap: t.spacing.md }}>
      <Text variant="h1" color="primary">
        {steps[index]?.label ?? ''}
      </Text>

      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setTrackW(w);
            trackWSV.value = w;
          }}
          style={{ height: THUMB, justifyContent: 'center' }}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          {/* rail */}
          <View style={{ height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: t.colors.border }} />
          {/* active fill */}
          <Animated.View
            style={[
              { position: 'absolute', left: 0, height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: t.colors.primary },
              fillStyle,
            ]}
          />
          {/* step ticks */}
          {trackW > 0 &&
            steps.map((_, i) => {
              const left = THUMB / 2 + (n > 1 ? i / (n - 1) : 0) * travel;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left: left - 2,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: t.colors.card,
                  }}
                />
              );
            })}
          {/* thumb */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: t.colors.primary,
                borderWidth: 3,
                borderColor: t.colors.card,
              },
              t.shadows.sm,
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>

      {/* step labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {steps.map((s, i) => (
          <Text
            key={s.value}
            variant="caption"
            color={i === index ? 'primary' : 'textSecondary'}
            style={{ fontWeight: i === index ? '700' : '400' }}
          >
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
