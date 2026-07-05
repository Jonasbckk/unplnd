import { useAuthStore } from '@/features/auth/auth-store';
import { getBlockedIds, getPublicProfile, type PublicProfile } from '@/lib/community';
import { supabase } from '@/lib/supabase';

export interface SharedPlan {
  title: string;
  route: { time?: string; title: string }[];
  photo?: string | null;
  sourceId?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  sharedPlan: SharedPlan | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  title: string | null;
  other: PublicProfile | null;
  memberCount: number;
  lastBody: string | null;
  lastIsPlan: boolean;
  lastAt: string;
}

export interface ConversationMeta {
  isGroup: boolean;
  title: string | null;
  participants: PublicProfile[];
  votingActive: boolean;
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    body: (row.body as string | null) ?? null,
    sharedPlan: (row.shared_plan as SharedPlan | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/** Open (or create) the 1:1 DM with a connected user. Returns the conversation id. */
export async function getOrCreateDm(otherId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherId });
  return error ? null : (data as string);
}

/** Create a group with a title and some of your accepted connections. Returns the conversation id. */
export async function createGroup(title: string, memberIds: string[]): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_group', { title_in: title, member_ids: memberIds });
  return error ? null : (data as string);
}

export async function getMessages(convId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, shared_plan, created_at')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(300);
  return (data ?? []).map(mapMessage);
}

export async function sendMessage(convId: string, body: string, sharedPlan?: SharedPlan | null): Promise<boolean> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return false;
  const trimmed = body.trim();
  if (!trimmed && !sharedPlan) return false;
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: convId, sender_id: me, body: trimmed || null, shared_plan: sharedPlan ?? null });
  return !error;
}

/** Live subscription to new messages in a conversation. Returns an unsubscribe function. */
export function subscribeToMessages(convId: string, onInsert: (m: Message) => void): () => void {
  const channel = supabase
    .channel(`messages:${convId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
      (payload) => onInsert(mapMessage(payload.new as Record<string, unknown>)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getConversationMeta(convId: string): Promise<ConversationMeta | null> {
  const { data: c } = await supabase
    .from('conversations')
    .select('is_group, title, voting_active')
    .eq('id', convId)
    .maybeSingle();
  if (!c) return null;
  const { data: parts } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', convId);
  const profiles = (
    await Promise.all((parts ?? []).map((p) => getPublicProfile(p.user_id as string)))
  ).filter((p): p is PublicProfile => p !== null);
  return {
    isGroup: Boolean(c.is_group),
    title: (c.title as string | null) ?? null,
    participants: profiles,
    votingActive: Boolean(c.voting_active),
  };
}

/** Start or stop the vote for a conversation (any participant). */
export async function setConversationVoting(convId: string, active: boolean): Promise<boolean> {
  const { error } = await supabase.rpc('set_conversation_voting', { conv: convId, active });
  return !error;
}

/** Live updates to a conversation row (e.g. the vote being started/stopped). */
export function subscribeToConversation(convId: string, onChange: (votingActive: boolean) => void): () => void {
  const channel = supabase
    .channel(`conversation:${convId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${convId}` },
      (payload) => onChange(Boolean((payload.new as { voting_active?: boolean }).voting_active)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** The inbox — every conversation you're in, most-recent first. */
export async function getConversations(): Promise<ConversationSummary[]> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return [];
  const blocked = await getBlockedIds();
  const { data: mine } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', me);
  const ids = (mine ?? []).map((p) => p.conversation_id as string);
  if (!ids.length) return [];

  const { data: convs } = await supabase
    .from('conversations')
    .select('id, is_group, title, last_message_at')
    .in('id', ids)
    .order('last_message_at', { ascending: false });
  if (!convs) return [];

  const { data: allParts } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', ids);
  const byConv = new Map<string, string[]>();
  for (const p of allParts ?? []) {
    const cid = p.conversation_id as string;
    const arr = byConv.get(cid) ?? [];
    arr.push(p.user_id as string);
    byConv.set(cid, arr);
  }

  const { data: msgs } = await supabase
    .from('messages')
    .select('conversation_id, body, shared_plan, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false })
    .limit(200);
  const lastByConv = new Map<string, { body: string | null; isPlan: boolean }>();
  for (const m of msgs ?? []) {
    const cid = m.conversation_id as string;
    if (!lastByConv.has(cid)) {
      lastByConv.set(cid, { body: (m.body as string | null) ?? null, isPlan: Boolean(m.shared_plan) });
    }
  }

  const summaries = await Promise.all(
    convs.map(async (c) => {
      const cid = c.id as string;
      const members = byConv.get(cid) ?? [];
      const isGroup = Boolean(c.is_group);
      let other: PublicProfile | null = null;
      if (!isGroup) {
        const otherId = members.find((u) => u !== me);
        if (otherId) other = await getPublicProfile(otherId);
      }
      const last = lastByConv.get(cid);
      return {
        id: cid,
        isGroup,
        title: (c.title as string | null) ?? null,
        other,
        memberCount: members.length,
        lastBody: last?.body ?? null,
        lastIsPlan: last?.isPlan ?? false,
        lastAt: (c.last_message_at as string) ?? '',
      } as ConversationSummary;
    }),
  );
  // Hide 1:1 chats with people you've blocked.
  return summaries.filter((s) => s.isGroup || !s.other || !blocked.has(s.other.id));
}

/** Report a message for moderation (App-Store requirement for direct messages). */
export async function reportMessage(messageId: string, reason?: string): Promise<void> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return;
  try {
    await supabase.from('message_reports').insert({ message_id: messageId, reporter_id: me, reason: reason ?? null });
  } catch {
    // best effort
  }
}

/** Leave a group (or remove yourself from any conversation). */
export async function leaveConversation(convId: string): Promise<void> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return;
  await supabase.from('conversation_participants').delete().eq('conversation_id', convId).eq('user_id', me);
}
