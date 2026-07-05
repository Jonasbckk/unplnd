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
import { AttachSheet } from '@/features/messaging/AttachSheet';
import { PlanPreviewSheet } from '@/features/messaging/PlanPreviewSheet';
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
  setConversationVoting,
  subscribeToConversation,
  subscribeToMessages,
  type Message,
  type SharedPlan,
} from '@/lib/messaging';
import {
  getConversationRsvps,
  removeRsvp,
  setRsvp,
  subscribeToRsvps,
  type RsvpStatus,
  type RsvpTally,
} from '@/lib/plan-rsvp';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// A message that is only emoji (a sticker, or a bare "👍") renders big, without a bubble.
// Hermes-safe heuristic (no \p{} Unicode property escapes): short, no letters/digits,
// and at least one non-ASCII character.
function isEmojiOnly(text: string): boolean {
  const s = text.trim();
  if (!s || s.length > 12) return false;
  if (/[a-zA-Z0-9]/.test(s)) return false;
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) return true;
  }
  return false;
}

function PlanCard({
  plan,
  onPress,
  onDark,
  isFavorite,
}: {
  plan: SharedPlan;
  onPress?: () => void;
  onDark: boolean;
  isFavorite?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useT();
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
      {isFavorite ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 }}>
          <Ionicons name="trophy" size={12} color={t.colors.accentOrange} />
          <Text variant="caption" style={{ color: t.colors.accentOrange, fontWeight: '700' }}>
            {tr('rsvp.favorite')}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name="map-outline" size={14} color={fg} />
        <Text variant="small" style={{ color: fg, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {plan.title}
        </Text>
        <Ionicons name="chevron-expand" size={13} color={sub} />
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
  isFavorite,
}: {
  message: Message;
  mine: boolean;
  senderName?: string;
  onPlan?: (p: SharedPlan) => void;
  onLongPress?: () => void;
  isFavorite?: boolean;
}) {
  const t = useTheme();
  const sticker = !!message.body && !message.sharedPlan && isEmojiOnly(message.body);
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
          paddingVertical: sticker ? 0 : t.spacing.sm,
          paddingHorizontal: sticker ? 0 : t.spacing.base,
          borderRadius: t.radius.lg,
          borderBottomRightRadius: mine ? 4 : t.radius.lg,
          borderBottomLeftRadius: mine ? t.radius.lg : 4,
          backgroundColor: sticker ? 'transparent' : mine ? t.colors.primary : t.colors.surfaceSecondary,
        }}
      >
        {message.body ? (
          sticker ? (
            <Text style={{ fontSize: 52, lineHeight: 60 }}>{message.body}</Text>
          ) : (
            <Text variant="body" style={{ color: mine ? '#FFFFFF' : t.colors.textPrimary }}>
              {message.body}
            </Text>
          )
        ) : null}
        {message.sharedPlan ? (
          <PlanCard
            plan={message.sharedPlan}
            onDark={mine}
            isFavorite={isFavorite}
            onPress={() => message.sharedPlan && onPlan?.(message.sharedPlan)}
          />
        ) : null}
      </Pressable>
      <Text variant="caption" color="textSecondary" style={{ marginTop: 2, marginHorizontal: 6, opacity: 0.7 }}>
        {formatTime(message.createdAt)}
      </Text>
    </Animated.View>
  );
}

function RsvpButton({
  label,
  icon,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: t.spacing.md,
        paddingVertical: 7,
        borderRadius: t.radius.pill,
        backgroundColor: active ? activeColor : t.colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: active ? activeColor : t.colors.border,
      }}
    >
      <Ionicons name={icon} size={15} color={active ? '#FFFFFF' : t.colors.textSecondary} />
      <Text variant="small" style={{ fontWeight: '700', color: active ? '#FFFFFF' : t.colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** "Are we going?" — a Dabei/Raus row under a shared plan, with a live tally. */
function RsvpBar({
  tally,
  mine,
  myId,
  onSet,
}: {
  tally?: RsvpTally;
  mine: boolean;
  myId?: string;
  onSet: (status: RsvpStatus) => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const going = tally?.in ?? [];
  const out = tally?.out ?? [];
  const myStatus = myId && going.includes(myId) ? 'in' : myId && out.includes(myId) ? 'out' : null;

  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', marginBottom: t.spacing.sm, gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <RsvpButton
          label={tr('rsvp.in')}
          icon="checkmark-circle"
          active={myStatus === 'in'}
          activeColor={t.colors.success}
          onPress={() => onSet('in')}
        />
        <RsvpButton
          label={tr('rsvp.out')}
          icon="close-circle"
          active={myStatus === 'out'}
          activeColor={t.colors.textSecondary}
          onPress={() => onSet('out')}
        />
      </View>
      {going.length > 0 ? (
        <Text variant="caption" color="textSecondary" style={{ marginHorizontal: 4 }}>
          {tr('rsvp.going', { count: going.length })}
        </Text>
      ) : null}
    </View>
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
  const [rsvps, setRsvps] = useState<Record<string, RsvpTally>>({});
  const [preview, setPreview] = useState<SharedPlan | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
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
      setVotingActive(meta.votingActive);
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
    void getConversationRsvps(id).then((r) => active && setRsvps(r));
    const unsub = subscribeToMessages(id, (m) => {
      setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
    });
    const unsubRsvps = subscribeToRsvps(id, () => {
      void getConversationRsvps(id).then((r) => active && setRsvps(r));
    });
    const unsubConv = subscribeToConversation(id, (va) => {
      if (active) setVotingActive(va);
    });
    return () => {
      active = false;
      unsub();
      unsubRsvps();
      unsubConv();
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

  const openFull = (sourceId: string) => {
    setPreview(null);
    router.push(`/community/${sourceId}` as Href);
  };

  const sendSticker = useCallback(
    (emoji: string) => {
      if (!id) return;
      haptics.light();
      void sendMessage(id, emoji);
    },
    [id],
  );

  const onRsvp = useCallback(
    async (messageId: string, status: RsvpStatus) => {
      if (!id || !me) return;
      haptics.light();
      const cur = rsvps[messageId];
      const already = cur?.in.includes(me) ? 'in' : cur?.out.includes(me) ? 'out' : null;
      // Optimistic — RSVP must feel instant; realtime reconciles for everyone.
      setRsvps((prev) => {
        const next: RsvpTally = {
          in: (prev[messageId]?.in ?? []).filter((u) => u !== me),
          out: (prev[messageId]?.out ?? []).filter((u) => u !== me),
        };
        if (already !== status) next[status].push(me);
        return { ...prev, [messageId]: next };
      });
      if (already === status) await removeRsvp(messageId);
      else await setRsvp(messageId, id, status);
    },
    [id, me, rsvps],
  );

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

  // V2 — a favourite is only crowned while a vote is explicitly running (never automatic).
  // Then the shared plan with the most "Dabei" wins.
  const sharedPlanMsgs = visible.filter((m) => m.sharedPlan);
  let favoriteMessageId: string | null = null;
  if (votingActive && sharedPlanMsgs.length >= 2) {
    let best = 0;
    for (const m of sharedPlanMsgs) {
      const n = rsvps[m.id]?.in.length ?? 0;
      if (n > best) {
        best = n;
        favoriteMessageId = m.id;
      }
    }
    if (best === 0) favoriteMessageId = null; // no votes yet → no favourite
  }

  const toggleVoting = useCallback(async () => {
    if (!id) return;
    haptics.light();
    const next = !votingActive;
    setVotingActive(next); // optimistic; realtime confirms for everyone
    await setConversationVoting(id, next);
  }, [id, votingActive]);

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
              <View key={m.id}>
                <Bubble
                  message={m}
                  mine={m.senderId === me}
                  senderName={isGroup ? names[m.senderId] : undefined}
                  onPlan={(p) => setPreview(p)}
                  onLongPress={() => reportMsg(m)}
                  isFavorite={m.id === favoriteMessageId}
                />
                {m.sharedPlan ? (
                  <RsvpBar
                    tally={rsvps[m.id]}
                    mine={m.senderId === me}
                    myId={me}
                    onSet={(status) => onRsvp(m.id, status)}
                  />
                ) : null}
              </View>
            ))
          )}
        </ScrollView>

        {votingActive ? (
          <Pressable
            onPress={toggleVoting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 7,
              backgroundColor: t.colors.accentOrange + '18',
            }}
          >
            <Ionicons name="trophy" size={13} color={t.colors.accentOrange} />
            <Text variant="caption" style={{ fontWeight: '700', color: t.colors.accentOrange }}>
              {tr('rsvp.voteActive')}
            </Text>
          </Pressable>
        ) : null}

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
          <Pressable
            onPress={() => {
              haptics.selection();
              setAttachOpen(true);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={24} color={t.colors.textPrimary} />
          </Pressable>
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

      <PlanPreviewSheet plan={preview} onClose={() => setPreview(null)} onOpenFull={openFull} />

      <AttachSheet
        visible={attachOpen}
        canVote={sharedPlanMsgs.length >= 2}
        votingActive={votingActive}
        onClose={() => setAttachOpen(false)}
        onSticker={sendSticker}
        onToggleVote={toggleVoting}
      />
    </View>
  );
}
