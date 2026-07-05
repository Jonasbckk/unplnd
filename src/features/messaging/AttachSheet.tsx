import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

// Evening / social themed stickers — sending one posts it as a big emoji (no bubble).
const STICKERS = [
  '🎉', '🥳', '🍻', '🍸', '🥂', '🍷', '🔥', '✨', '💫', '🌅',
  '🌙', '☕', '🍕', '🌮', '🎶', '💃', '🕺', '😎', '🤩', '😂',
  '😍', '❤️', '👍', '🙌', '👏', '🚗', '📍', '🎬', '🎳', '😴',
];

function MenuRow({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint?: string;
  onPress: () => void;
}) {
  const t = useTheme();
  const color = tint ?? t.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.pill,
          backgroundColor: color + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text variant="body" style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The "+" attachment menu — stickers now, and the home for voting (photos/voice land here next). */
export function AttachSheet({
  visible,
  canVote,
  votingActive,
  onClose,
  onSticker,
  onToggleVote,
}: {
  visible: boolean;
  canVote: boolean;
  votingActive: boolean;
  onClose: () => void;
  onSticker: (emoji: string) => void;
  onToggleVote: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const [mode, setMode] = useState<'menu' | 'stickers'>('menu');

  useEffect(() => {
    if (visible) setMode('menu');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.card,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            paddingHorizontal: t.spacing.lg,
            paddingTop: t.spacing.md,
            paddingBottom: t.spacing.xl,
            maxHeight: '70%',
          }}
        >
          <View
            style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border, marginBottom: t.spacing.md }}
          />

          {mode === 'menu' ? (
            <View>
              <MenuRow
                icon="happy-outline"
                label={tr('attach.sticker')}
                onPress={() => {
                  haptics.selection();
                  setMode('stickers');
                }}
              />
              {canVote || votingActive ? (
                <MenuRow
                  icon={votingActive ? 'trophy' : 'podium-outline'}
                  tint={t.colors.accentOrange}
                  label={votingActive ? tr('rsvp.voteActive') : tr('rsvp.startVote')}
                  onPress={() => {
                    onToggleVote();
                    onClose();
                  }}
                />
              ) : null}
            </View>
          ) : (
            <View style={{ gap: t.spacing.md }}>
              <Pressable
                onPress={() => setMode('menu')}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="chevron-back" size={18} color={t.colors.textSecondary} />
                <Text variant="small" color="textSecondary">
                  {tr('attach.sticker')}
                </Text>
              </Pressable>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.sm }}>
                  {STICKERS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        haptics.light();
                        onSticker(emoji);
                        onClose();
                      }}
                      style={{
                        width: '18%',
                        aspectRatio: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: t.radius.md,
                        backgroundColor: t.colors.surfaceSecondary,
                      }}
                    >
                      <Text style={{ fontSize: 30 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
