import type * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/features/auth/auth-store';
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
  avatarUrl: string | null;
  members: GroupMember[];
}

/** Members of a group + who created it + who is timed out. */
export async function getGroupInfo(convId: string): Promise<GroupInfo | null> {
  const { data: c } = await supabase
    .from('conversations')
    .select('title, created_by, avatar_url')
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
    avatarUrl: (c.avatar_url as string | null) ?? null,
    members,
  };
}

/** Creator-only: upload a new group photo (public avatars bucket) and set it. Returns the URL. */
export async function updateGroupAvatar(
  convId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;
  try {
    const response = await fetch(asset.uri);
    const body = await response.arrayBuffer();
    const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
    // Stored under the creator's folder so it passes the avatars-bucket owner RLS.
    const path = `${userId}/group-${convId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
    if (upErr) return null;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.rpc('set_group_avatar', { conv: convId, url });
    return error ? null : url;
  } catch {
    return null;
  }
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
