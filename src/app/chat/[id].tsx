import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { blockUser, getBlockedIds, type PublicProfile } from '@/lib/community';
import { confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import {
  getConversationMeta,
  getMessages,
  leaveConversation,
  reportMessage,
  sendMessage,
  subscribeToMessages,
  type Message,
  type SharedPlan,
} from '@/lib/messaging';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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

function Bubble({
  message,
  mine,
  senderName,
  onPlan,
  onLongPress,
}: {
  message: Message;
  mine: boolean;
  senderName?: string;
  onPlan?: (p: SharedPlan) => void;
  onLongPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: t.spacing.sm }}
    >
      {senderName && !mine ? (
        <Text variant="caption" color="textSecondary" style={{ marginLeft: 8, marginBottom: 2 }}>
          {senderName}
        </Text>
      ) : null}
      <Pressable
        onLongPress={mine ? undefined : onLongPress}
        delayLongPress={350}
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
      </Pressable>
      <Text variant="caption" color="textSecondary" style={{ marginTop: 2, marginHorizontal: 6, opacity: 0.7 }}>
        {formatTime(message.createdAt)}
      </Text>
    </Animated.View>
  );
}

/** Chat — 1:1 or group. Live via Supabase Realtime. */
export default function ChatScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [title, setTitle] = useState('');
  const [otherId, setOtherId] = useState<string | null>(null);
  const [partner, setPartner] = useState<PublicProfile | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getMessages(id).then((m) => active && setMessages(m));
    void getBlockedIds().then((b) => {
      if (active) setBlocked(b);
    });
    void getConversationMeta(id).then((meta) => {
      if (!active || !meta) return;
      setIsGroup(meta.isGroup);
      const map: Record<string, string> = {};
      for (const p of meta.participants) map[p.id] = p.name ?? tr('community.someone');
      setNames(map);
      if (meta.isGroup) {
        setTitle(meta.title ?? tr('chat.group'));
      } else {
        const other = meta.participants.find((p) => p.id !== me) ?? null;
        setPartner(other);
        setOtherId(other?.id ?? null);
        setTitle(other?.name ?? tr('community.someone'));
      }
    });
    const unsub = subscribeToMessages(id, (m) => {
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    });
    return () => {
      active = false;
      unsub();
    };
  }, [id, tr, me]);

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

  const reportMsg = async (m: Message) => {
    const ok = await confirmDialog(
      tr('chatMod.reportTitle'),
      tr('chatMod.reportBody'),
      tr('chatMod.report'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await reportMessage(m.id);
    toast(tr('chatMod.reported'));
  };

  const blockPartner = async () => {
    setMenuOpen(false);
    if (!otherId) return;
    const ok = await confirmDialog(
      tr('chatMod.blockTitle'),
      tr('chatMod.blockBody'),
      tr('chatMod.block'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await blockUser(otherId);
    toast(tr('chatMod.blocked'));
    router.back();
  };

  const leaveGroup = async () => {
    setMenuOpen(false);
    if (!id) return;
    const ok = await confirmDialog(
      tr('chatMod.leaveTitle'),
      tr('chatMod.leaveBody'),
      tr('chatMod.leave'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await leaveConversation(id);
    toast(tr('chatMod.left'));
    router.back();
  };

  const visible = messages.filter((m) => !blocked.has(m.senderId));

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
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: t.radius.pill,
                backgroundColor: isGroup ? t.colors.accentOlive : t.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {isGroup ? (
                <Ionicons name="people" size={19} color="#FFFFFF" />
              ) : partner?.avatar ? (
                <Image source={{ uri: partner.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Text variant="small" color="onPrimary" style={{ fontWeight: '700' }}>
                  {(title || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text variant="h3" numberOfLines={1}>
                  {title || tr('chat.title')}
                </Text>
                {!isGroup && partner?.isFounder ? <Ionicons name="ribbon" size={14} color={t.colors.primary} /> : null}
              </View>
              {isGroup ? (
                <Text variant="caption" color="textSecondary">
                  {tr('chat.members', { count: Object.keys(names).length })}
                </Text>
              ) : null}
            </View>
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={22} color={t.colors.textPrimary} />
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {visible.length === 0 ? (
            <View style={{ alignItems: 'center', gap: t.spacing.md, marginTop: t.spacing.huge }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: t.radius.pill,
                  backgroundColor: t.colors.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chatbubbles-outline" size={32} color={t.colors.primary} />
              </View>
              <Text variant="body" color="textSecondary" center>
                {tr('chat.empty')}
              </Text>
            </View>
          ) : (
            visible.map((m) => (
              <Bubble
                key={m.id}
                message={m}
                mine={m.senderId === me}
                senderName={isGroup ? names[m.senderId] : undefined}
                onPlan={openPlan}
                onLongPress={() => reportMsg(m)}
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

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: t.colors.card,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              padding: t.spacing.lg,
              paddingBottom: t.spacing.xl,
              gap: t.spacing.xs,
            }}
          >
            {isGroup ? (
              <Pressable onPress={leaveGroup} style={{ paddingVertical: t.spacing.md }}>
                <Text variant="body" color="error" style={{ fontWeight: '600' }}>
                  {tr('chatMod.leave')}
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={blockPartner} style={{ paddingVertical: t.spacing.md }}>
                <Text variant="body" color="error" style={{ fontWeight: '600' }}>
                  {tr('chatMod.blockUser')}
                </Text>
              </Pressable>
            )}
            <Text variant="caption" color="textSecondary" style={{ paddingBottom: t.spacing.sm }}>
              {tr('chatMod.reportHint')}
            </Text>
            <Pressable onPress={() => setMenuOpen(false)} style={{ paddingVertical: t.spacing.md }}>
              <Text variant="body" color="textSecondary">
                {tr('common2.cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
