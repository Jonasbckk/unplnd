import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, PressableScale, Skeleton, StatementTitle, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { dateLocale, useT } from '@/lib/i18n';
import { getConversations, sendMessage, type ConversationSummary } from '@/lib/messaging';
import { useShareStore } from '@/store/share-store';
import { useTheme } from '@/theme';

/** Short inbox timestamp: today → HH:MM, this week → weekday, older → dd.mm. */
function formatLastAt(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString(dateLocale(), { weekday: 'short' });
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function Row({ conv, onPress }: { conv: ConversationSummary; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const name = conv.isGroup
    ? conv.title ?? tr('chat.group')
    : conv.other?.name ?? tr('community.someone');
  const avatar = conv.isGroup ? conv.avatarUrl : conv.other?.avatar ?? null;
  const preview = conv.lastIsPlan
    ? tr('messages.sharedPlan')
    : conv.lastIsImage
      ? tr('messages.sharedPhoto')
      : conv.lastIsAudio
        ? tr('messages.sharedVoice')
        : conv.lastIsLocation
          ? tr('messages.sharedLocation')
          : conv.lastBody ?? tr('messages.noMessages');
  const time = formatLastAt(conv.lastAt);
  // feedback="none": openConversation owns the haptic — success when sharing a plan into
  // this chat, selection otherwise. Two buzzes for one tap would feel broken.
  return (
    <PressableScale onPress={onPress} feedback="none" accessibilityLabel={name ?? undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.sm }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: t.radius.pill,
            backgroundColor: conv.isGroup ? t.colors.accentOlive : t.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : conv.isGroup ? (
            <Ionicons name="people" size={22} color={t.colors.onPrimary} />
          ) : (
            <Text variant="h3" color="onPrimary">
              {(name || '?').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
            {name}
          </Text>
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {preview}
          </Text>
        </View>
        {time ? (
          <Text variant="caption" color="textSecondary">
            {time}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
      </View>
    </PressableScale>
  );
}

/** Messages inbox. Doubles as a picker when sharing a plan into a chat. */
export default function MessagesScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sharePlan = useShareStore((s) => s.plan);
  const setSharePlan = useShareStore((s) => s.setPlan);

  const load = useCallback(async () => {
    setConversations(await getConversations());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openConversation = async (conv: ConversationSummary) => {
    if (sharePlan) {
      haptics.success();
      await sendMessage(conv.id, '', sharePlan);
      setSharePlan(null);
      router.replace(`/chat/${conv.id}` as Href);
      return;
    }
    haptics.selection();
    router.push(`/chat/${conv.id}` as Href);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.sm,
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <PressableScale
            onPress={() => {
              setSharePlan(null);
              router.back();
            }}
            feedback="light"
            hitTarget
            accessibilityLabel={tr('location.back')}
          >
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </PressableScale>
          <View style={{ flex: 1 }} />
          {!sharePlan && (
            <PressableScale
              onPress={() => router.push('/group/new' as Href)}
              feedback="light"
              hitTarget
              accessibilityLabel={tr('group.title')}
            >
              <Ionicons name="people-outline" size={24} color={t.colors.primary} />
            </PressableScale>
          )}
        </View>
        <View style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.md }}>
          <StatementTitle text={sharePlan ? tr('messages.shareTitle') : tr('messages.title')} />
        </View>
      </SafeAreaView>

      {sharePlan ? (
        <View style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.sm }}>
          <Text variant="small" color="textSecondary">
            {tr('messages.shareHint')}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} />}
      >
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.sm }}
            >
              <Skeleton width={48} height={48} radius={24} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="55%" height={15} />
                <Skeleton width="75%" height={12} />
              </View>
            </View>
          ))
        ) : conversations.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title={tr('messages.emptyTitle')} body={tr('messages.emptyBody')} />
        ) : (
          conversations.map((conv) => <Row key={conv.id} conv={conv} onPress={() => openConversation(conv)} />)
        )}
      </ScrollView>
    </View>
  );
}
