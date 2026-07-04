import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import {
  getConversationMeta,
  getMessages,
  sendMessage,
  subscribeToMessages,
  type Message,
  type SharedPlan,
} from '@/lib/messaging';
import { useTheme } from '@/theme';

function PlanCard({ plan, onPress, onDark }: { plan: SharedPlan; onPress?: () => void; onDark: boolean }) {
  const t = useTheme();
  const fg = onDark ? '#FFFFFF' : t.colors.textPrimary;
  const sub = onDark ? 'rgba(255,255,255,0.8)' : t.colors.textSecondary;
  const stops = plan.route.map((s) => s.title).slice(0, 3).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginTop: 6,
        padding: t.spacing.sm,
        borderRadius: t.radius.sm,
        backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : t.colors.background,
        gap: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name="map-outline" size={14} color={fg} />
        <Text variant="small" style={{ color: fg, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {plan.title}
        </Text>
      </View>
      {stops ? (
        <Text variant="caption" style={{ color: sub }} numberOfLines={1}>
          {stops}
          {plan.route.length > 3 ? ' …' : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Bubble({ message, mine, senderName, onPlan }: { message: Message; mine: boolean; senderName?: string; onPlan?: (p: SharedPlan) => void }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: t.spacing.sm }}>
      {senderName && !mine ? (
        <Text variant="caption" color="textSecondary" style={{ marginLeft: 8, marginBottom: 2 }}>
          {senderName}
        </Text>
      ) : null}
      <View
        style={{
          maxWidth: '82%',
          paddingVertical: t.spacing.sm,
          paddingHorizontal: t.spacing.base,
          borderRadius: t.radius.lg,
          borderBottomRightRadius: mine ? 4 : t.radius.lg,
          borderBottomLeftRadius: mine ? t.radius.lg : 4,
          backgroundColor: mine ? t.colors.primary : t.colors.surfaceSecondary,
        }}
      >
        {message.body ? (
          <Text variant="body" style={{ color: mine ? '#FFFFFF' : t.colors.textPrimary }}>
            {message.body}
          </Text>
        ) : null}
        {message.sharedPlan ? (
          <PlanCard plan={message.sharedPlan} onDark={mine} onPress={() => message.sharedPlan && onPlan?.(message.sharedPlan)} />
        ) : null}
      </View>
    </View>
  );
}

/** Chat — 1:1 or group. Live via Supabase Realtime. */
export default function ChatScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [title, setTitle] = useState('');
  const [otherId, setOtherId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getMessages(id).then((m) => active && setMessages(m));
    void getConversationMeta(id).then((meta) => {
      if (!active || !meta) return;
      setIsGroup(meta.isGroup);
      const map: Record<string, string> = {};
      for (const p of meta.participants) map[p.id] = p.name ?? tr('community.someone');
      setNames(map);
      if (meta.isGroup) {
        setTitle(meta.title ?? tr('chat.group'));
      }
      // For DMs the title/partner is resolved by the effect below (needs `me`).
    });
    const unsub = subscribeToMessages(id, (m) => {
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    });
    return () => {
      active = false;
      unsub();
    };
  }, [id, tr]);

  // Resolve the DM partner (the participant who isn't me) for the header + link.
  const me = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (isGroup || !me) return;
    const other = Object.keys(names).find((uid) => uid !== me);
    if (other) {
      setOtherId(other);
      setTitle(names[other] ?? '');
    }
  }, [isGroup, names, me]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const send = useCallback(async () => {
    if (!id) return;
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    haptics.light();
    await sendMessage(id, text);
    // realtime echoes it back; nothing else to do
  }, [id, draft]);

  const openPlan = (plan: SharedPlan) => {
    if (plan.sourceId) router.push(`/community/${plan.sourceId}` as Href);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
          <Pressable
            disabled={isGroup || !otherId}
            onPress={() => otherId && router.push(`/user/${otherId}` as Href)}
            style={{ flex: 1 }}
          >
            <Text variant="h3" numberOfLines={1}>
              {title || tr('chat.title')}
            </Text>
            {isGroup ? (
              <Text variant="caption" color="textSecondary">
                {tr('chat.members', { count: Object.keys(names).length })}
              </Text>
            ) : null}
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: t.spacing.lg, gap: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Text variant="body" color="textSecondary" center style={{ marginTop: t.spacing.xxl }}>
              {tr('chat.empty')}
            </Text>
          ) : (
            messages.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                mine={m.senderId === me}
                senderName={isGroup ? names[m.senderId] : undefined}
                onPlan={openPlan}
              />
            ))
          )}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: t.spacing.sm,
            paddingHorizontal: t.spacing.lg,
            paddingTop: t.spacing.sm,
            paddingBottom: t.spacing.base,
            borderTopWidth: 1,
            borderTopColor: t.colors.divider,
            backgroundColor: t.colors.background,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={tr('chat.placeholder')}
            placeholderTextColor={t.colors.textSecondary}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 44,
              paddingHorizontal: t.spacing.base,
              paddingTop: t.spacing.sm,
              paddingBottom: t.spacing.sm,
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.surfaceSecondary,
              color: t.colors.textPrimary,
              fontSize: 16,
            }}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: t.radius.pill,
              backgroundColor: draft.trim() ? t.colors.primary : t.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
