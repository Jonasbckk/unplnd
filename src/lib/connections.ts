import { useAuthStore } from '@/features/auth/auth-store';
import { track } from '@/lib/analytics';
import { getPublicProfile, type PublicProfile } from '@/lib/community';
import { supabase } from '@/lib/supabase';

/** Relationship between the current user and another user. */
export type ConnectionState = 'none' | 'outgoing' | 'incoming' | 'connected';

export interface ConnectionInfo {
  state: ConnectionState;
  rowId: string | null;
}

/** The connection row (if any) between me and `otherId`, in either direction. */
export async function getConnectionState(otherId: string): Promise<ConnectionInfo> {
  const me = useAuthStore.getState().user?.id;
  if (!me || me === otherId) return { state: 'none', rowId: null };
  const { data } = await supabase
    .from('connections')
    .select('id, requester_id, status')
    .or(`and(requester_id.eq.${me},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${me})`)
    .maybeSingle();
  if (!data) return { state: 'none', rowId: null };
  if (data.status === 'accepted') return { state: 'connected', rowId: data.id as string };
  return { state: (data.requester_id as string) === me ? 'outgoing' : 'incoming', rowId: data.id as string };
}

/** Send a connect request. If the other person already asked you, this accepts theirs. */
export async function sendRequest(otherId: string): Promise<ConnectionState> {
  const me = useAuthStore.getState().user?.id;
  if (!me || me === otherId) return 'none';
  const cur = await getConnectionState(otherId);
  if (cur.state === 'incoming' && cur.rowId) {
    await acceptRequest(cur.rowId);
    return 'connected';
  }
  if (cur.state !== 'none') return cur.state;
  const { error } = await supabase
    .from('connections')
    .insert({ requester_id: me, addressee_id: otherId, status: 'pending' });
  if (error) return 'none';
  track('connection_requested');
  return 'outgoing';
}

export async function acceptRequest(rowId: string): Promise<boolean> {
  const { error } = await supabase.from('connections').update({ status: 'accepted' }).eq('id', rowId);
  return !error;
}

/** Decline a request or disconnect an existing connection (either side may). */
export async function removeConnection(rowId: string): Promise<boolean> {
  const { error } = await supabase.from('connections').delete().eq('id', rowId);
  return !error;
}

export interface ConnectionEntry {
  rowId: string;
  profile: PublicProfile;
}

async function hydrate(rows: { id: string; otherId: string }[]): Promise<ConnectionEntry[]> {
  const entries = await Promise.all(
    rows.map(async (row) => {
      const profile = await getPublicProfile(row.otherId);
      return profile ? { rowId: row.id, profile } : null;
    }),
  );
  return entries.filter((e): e is ConnectionEntry => e !== null);
}

/** Pending requests other people sent you. */
export async function getIncomingRequests(): Promise<ConnectionEntry[]> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return [];
  const { data } = await supabase
    .from('connections')
    .select('id, requester_id')
    .eq('addressee_id', me)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return hydrate(data.map((r) => ({ id: r.id as string, otherId: r.requester_id as string })));
}

/** Your accepted connections. */
export async function getConnections(): Promise<ConnectionEntry[]> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return [];
  const { data } = await supabase
    .from('connections')
    .select('id, requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  if (!data) return [];
  return hydrate(
    data.map((r) => ({
      id: r.id as string,
      otherId: (r.requester_id as string) === me ? (r.addressee_id as string) : (r.requester_id as string),
    })),
  );
}

export interface UserResult {
  id: string;
  name: string | null;
  avatar: string | null;
  isFounder: boolean;
}

/** Search people by name (to connect without needing a published plan). */
export async function searchUsers(query: string): Promise<UserResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.rpc('search_users', { q });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: (r.display_name as string | null) ?? null,
    avatar: (r.photo_url as string | null) ?? null,
    isFounder: Boolean(r.is_founder),
  }));
}

/** Count of pending requests waiting for you (for the Profile badge). */
export async function getPendingCount(): Promise<number> {
  const me = useAuthStore.getState().user?.id;
  if (!me) return 0;
  const { count } = await supabase
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', me)
    .eq('status', 'pending');
  return count ?? 0;
}
