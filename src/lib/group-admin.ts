import { getPublicProfile, type PublicProfile } from '@/lib/community';
import { supabase } from '@/lib/supabase';

export interface GroupMember {
  profile: PublicProfile;
  /** ISO timestamp until which the member is timed out, or null. */
  mutedUntil: string | null;
}

export interface GroupInfo {
  title: string | null;
  createdBy: string | null;
  members: GroupMember[];
}

/** Members of a group + who created it + who is timed out. */
export async function getGroupInfo(convId: string): Promise<GroupInfo | null> {
  const { data: c } = await supabase
    .from('conversations')
    .select('title, created_by')
    .eq('id', convId)
    .maybeSingle();
  if (!c) return null;
  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('user_id, muted_until')
    .eq('conversation_id', convId);
  const members: GroupMember[] = [];
  for (const p of parts ?? []) {
    const profile = await getPublicProfile(p.user_id as string);
    if (profile) members.push({ profile, mutedUntil: (p.muted_until as string | null) ?? null });
  }
  return {
    title: (c.title as string | null) ?? null,
    createdBy: (c.created_by as string | null) ?? null,
    members,
  };
}

/** Creator-only: rename the group. */
export async function renameGroup(convId: string, title: string): Promise<boolean> {
  const { error } = await supabase.rpc('rename_group', { conv: convId, title_in: title });
  return !error;
}

/** Creator-only: remove a member from the group. */
export async function removeParticipant(convId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('remove_participant', { conv: convId, target: userId });
  return !error;
}

/** Creator-only: time a member out for `minutes` (0 clears it). */
export async function setParticipantTimeout(convId: string, userId: string, minutes: number): Promise<boolean> {
  const { error } = await supabase.rpc('set_participant_timeout', {
    conv: convId,
    target: userId,
    minutes,
  });
  return !error;
}

/** Creator-only: add accepted connections. hideHistory hides earlier messages from the new members. */
export async function addGroupMembers(
  convId: string,
  memberIds: string[],
  hideHistory: boolean,
): Promise<boolean> {
  const { error } = await supabase.rpc('add_group_members', {
    conv: convId,
    member_ids: memberIds,
    hide_history: hideHistory,
  });
  return !error;
}
