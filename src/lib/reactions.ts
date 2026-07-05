import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

export interface Reaction {
  emoji: string;
  userId: string;
}

/** messageId → its reactions. */
export type ReactionMap = Record<string, Reaction[]>;

export async function getConversationReactions(conversationId: string): Promise<ReactionMap> {
  const { data, error } = await supabase
    .from('message_reactions')
    .select('message_id, user_id, emoji')
    .eq('conversation_id', conversationId);
  if (error || !data) return {};

  const map: ReactionMap = {};
  for (const row of data) {
    const mid = row.message_id as string;
    (map[mid] ??= []).push({ emoji: row.emoji as string, userId: row.user_id as string });
  }
  return map;
}

/** Set (or change) my reaction on a message. */
export async function setReaction(
  messageId: string,
  conversationId: string,
  emoji: string,
): Promise<boolean> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return false;
  const { error } = await supabase
    .from('message_reactions')
    .upsert(
      { message_id: messageId, conversation_id: conversationId, user_id: me, emoji },
      { onConflict: 'message_id,user_id' },
    );
  return !error;
}

/** Remove my reaction from a message. */
export async function removeReaction(messageId: string): Promise<boolean> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return false;
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', me);
  return !error;
}

/** Live updates when anyone reacts in the conversation. */
export function subscribeToReactions(conversationId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`reactions:${conversationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message_reactions', filter: `conversation_id=eq.${conversationId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
