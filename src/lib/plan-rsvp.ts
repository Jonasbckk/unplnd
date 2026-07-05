import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

export type RsvpStatus = 'in' | 'out';

/** Who is in / out for one shared plan (arrays of user ids). */
export interface RsvpTally {
  in: string[];
  out: string[];
}

/** All RSVPs in a conversation, keyed by the shared-plan message id. */
export async function getConversationRsvps(conversationId: string): Promise<Record<string, RsvpTally>> {
  const { data, error } = await supabase
    .from('plan_rsvps')
    .select('message_id, user_id, status')
    .eq('conversation_id', conversationId);
  if (error || !data) return {};

  const map: Record<string, RsvpTally> = {};
  for (const row of data) {
    const mid = row.message_id as string;
    const tally = (map[mid] ??= { in: [], out: [] });
    if (row.status === 'in') tally.in.push(row.user_id as string);
    else tally.out.push(row.user_id as string);
  }
  return map;
}

/** Set (or change) my RSVP for a shared plan. */
export async function setRsvp(
  messageId: string,
  conversationId: string,
  status: RsvpStatus,
): Promise<boolean> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return false;
  const { error } = await supabase
    .from('plan_rsvps')
    .upsert(
      { message_id: messageId, conversation_id: conversationId, user_id: me, status },
      { onConflict: 'message_id,user_id' },
    );
  return !error;
}

/** Clear my RSVP for a shared plan (back to undecided). */
export async function removeRsvp(messageId: string): Promise<boolean> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return false;
  const { error } = await supabase
    .from('plan_rsvps')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', me);
  return !error;
}

/** Live updates when anyone in the conversation changes their RSVP. */
export function subscribeToRsvps(conversationId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`rsvps:${conversationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'plan_rsvps', filter: `conversation_id=eq.${conversationId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
