import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { getChatMediaUrl } from '@/lib/chat-media';
import { useTheme } from '@/theme';

function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** A voice message — play/pause with a progress bar, streamed from a signed URL. */
export function VoiceMessage({
  path,
  duration,
  mine,
}: {
  path: string;
  duration: number | null;
  mine: boolean;
}) {
  const t = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let active = true;
    void getChatMediaUrl(path).then((u) => {
      if (active && u) {
        setUrl(u);
        player.replace({ uri: u });
      }
    });
    return () => {
      active = false;
    };
    // player identity is stable for the component's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const total = status.duration || duration || 0;
  const progress = total > 0 ? Math.min(status.currentTime / total, 1) : 0;
  const fg = mine ? '#FFFFFF' : t.colors.textPrimary;
  const track = mine ? 'rgba(255,255,255,0.3)' : t.colors.border;

  const toggle = () => {
    if (!url) return;
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || (total > 0 && status.currentTime >= total - 0.15)) {
        void player.seekTo(0);
      }
      player.play();
    }
  };

  const label = status.playing || status.currentTime > 0.2 ? fmt(status.currentTime) : fmt(total);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minWidth: 172, paddingVertical: 2 }}>
      <Pressable onPress={toggle} hitSlop={6}>
        <Ionicons name={status.playing ? 'pause-circle' : 'play-circle'} size={34} color={fg} />
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: track, overflow: 'hidden' }}>
          <View style={{ flex: progress, backgroundColor: fg }} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text variant="caption" style={{ color: fg, opacity: 0.85 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
