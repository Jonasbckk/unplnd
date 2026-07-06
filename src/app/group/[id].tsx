import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Screen, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { getConnections, type ConnectionEntry } from '@/lib/connections';
import { confirmDialog } from '@/lib/confirm';
import {
  addGroupMembers,
  getGroupInfo,
  removeParticipant,
  renameGroup,
  setParticipantTimeout,
  updateGroupAvatar,
  type GroupInfo,
  type GroupMember,
} from '@/lib/group-admin';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { pickAvatar } from '@/lib/profile';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

const TIMEOUTS: { minutes: number; key: string }[] = [
  { minutes: 15, key: 'timeout15' },
  { minutes: 60, key: 'timeout60' },
  { minutes: 1440, key: 'timeout1440' },
];

export default function GroupInfoScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useAuthStore((s) => s.user?.id);
  const [info, setInfo] = useState<GroupInfo | null>(null);
  const [actionMember, setActionMember] = useState<GroupMember | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [connections, setConnections] = useState<ConnectionEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [historyVisible, setHistoryVisible] = useState(true);

  const amCreator = !!me && info?.createdBy === me;

  const reload = useCallback(() => {
    if (id) void getGroupInfo(id).then(setInfo);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveName = async () => {
    if (!id || !nameDraft.trim()) return;
    setRenaming(false);
    const ok = await renameGroup(id, nameDraft.trim());
    toast(ok ? tr('groupInfo.renamed') : tr('editProfile.failed'));
    if (ok) reload();
  };

  const changeAvatar = async () => {
    if (!id || !amCreator) return;
    const asset = await pickAvatar();
    if (!asset) return;
    const url = await updateGroupAvatar(id, asset);
    if (url) {
      haptics.success();
      toast(tr('editProfile.avatarUpdated'));
      reload();
    } else {
      toast(tr('editProfile.failed'));
    }
  };

  const doTimeout = async (minutes: number) => {
    if (!id || !actionMember) return;
    const target = actionMember.profile.id;
    setActionMember(null);
    const ok = await setParticipantTimeout(id, target, minutes);
    if (ok) {
      haptics.success();
      toast(minutes > 0 ? tr('groupInfo.timeoutSet') : tr('groupInfo.timeoutCleared'));
      reload();
    }
  };

  const doRemove = async () => {
    if (!id || !actionMember) return;
    const target = actionMember.profile.id;
    const name = actionMember.profile.name ?? tr('community.someone');
    setActionMember(null);
    const ok = await confirmDialog(
      tr('groupInfo.removeTitle'),
      tr('groupInfo.removeBody', { name }),
      tr('groupInfo.remove'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    const done = await removeParticipant(id, target);
    if (done) {
      haptics.success();
      toast(tr('groupInfo.removed'));
      reload();
    }
  };

  const openInvite = async () => {
    setInviteOpen(true);
    setSelected(new Set());
    setHistoryVisible(true);
    const all = await getConnections();
    const memberIds = new Set((info?.members ?? []).map((m) => m.profile.id));
    setConnections(all.filter((c) => !memberIds.has(c.profile.id)));
  };

  const confirmInvite = async () => {
    if (!id || selected.size === 0) return;
    setInviteOpen(false);
    const ok = await addGroupMembers(id, [...selected], !historyVisible);
    if (ok) {
      haptics.success();
      toast(tr('groupInfo.invited'));
      reload();
    } else {
      toast(tr('editProfile.failed'));
    }
  };

  const mutedNow = (m: GroupMember) => !!m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
          <Text variant="h2">{tr('groupInfo.title')}</Text>
        </View>
      </SafeAreaView>

      <Screen scroll edges={[]} contentStyle={{ gap: t.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Pressable onPress={amCreator ? changeAvatar : undefined} style={{ width: 72, height: 72 }}>
            {info?.avatarUrl ? (
              <Image source={{ uri: info.avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} contentFit="cover" />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: t.colors.accentOlive,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="people" size={34} color="#FFFFFF" />
              </View>
            )}
            {amCreator ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: t.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: t.colors.background,
                }}
              >
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <Text variant="h2">{info?.title ?? tr('chat.group')}</Text>
            {amCreator ? (
              <Pressable
                onPress={() => {
                  setNameDraft(info?.title ?? '');
                  setRenaming(true);
                }}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={18} color={t.colors.primary} />
              </Pressable>
            ) : null}
          </View>
          <Text variant="small" color="textSecondary">
            {tr('chat.members', { count: info?.members.length ?? 0 })}
          </Text>
        </View>

        {amCreator ? (
          <Button title={tr('groupInfo.invite')} variant="secondary" onPress={openInvite} />
        ) : null}

        <View style={{ gap: t.spacing.sm }}>
          <Text variant="h3">{tr('groupInfo.members')}</Text>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.base }}>
            {(info?.members ?? []).map((m, i) => {
              const isCreator = m.profile.id === info?.createdBy;
              const canManage = amCreator && m.profile.id !== me;
              return (
                <Pressable
                  key={m.profile.id}
                  onPress={() => (canManage ? setActionMember(m) : undefined)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing.md,
                    paddingVertical: t.spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.colors.divider,
                  }}
                >
                  {m.profile.avatar ? (
                    <Image source={{ uri: m.profile.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text variant="body" color="onPrimary" style={{ fontWeight: '700' }}>
                        {(m.profile.name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {m.profile.name ?? tr('community.someone')}
                      {m.profile.id === me ? ` (${tr('groupInfo.you')})` : ''}
                    </Text>
                    {mutedNow(m) ? (
                      <Text variant="caption" color="error">
                        {tr('groupInfo.muted')}
                      </Text>
                    ) : null}
                  </View>
                  {isCreator ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="ribbon" size={13} color={t.colors.primary} />
                      <Text variant="caption" style={{ color: t.colors.primary, fontWeight: '600' }}>
                        {tr('groupInfo.creator')}
                      </Text>
                    </View>
                  ) : canManage ? (
                    <Ionicons name="ellipsis-horizontal" size={20} color={t.colors.textSecondary} />
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        </View>
      </Screen>

      {/* Rename */}
      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <Pressable
          onPress={() => setRenaming(false)}
          style={{ flex: 1, backgroundColor: t.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: t.spacing.lg }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380 }}>
            <Card style={{ gap: t.spacing.md }}>
              <Text variant="h3">{tr('groupInfo.renameTitle')}</Text>
              <Input value={nameDraft} onChangeText={setNameDraft} placeholder={tr('groupInfo.renamePlaceholder')} />
              <Button title={tr('groupInfo.save')} onPress={saveName} disabled={!nameDraft.trim()} />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Member actions (creator) */}
      <Modal visible={!!actionMember} transparent animationType="slide" onRequestClose={() => setActionMember(null)}>
        <Pressable onPress={() => setActionMember(null)} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: t.colors.card, borderTopLeftRadius: t.radius.sheet, borderTopRightRadius: t.radius.sheet, padding: t.spacing.lg, paddingBottom: t.spacing.xl, gap: 2 }}
          >
            <Text variant="small" color="textSecondary" style={{ marginBottom: t.spacing.sm }}>
              {actionMember?.profile.name ?? ''}
            </Text>
            {TIMEOUTS.map((to) => (
              <Pressable key={to.minutes} onPress={() => doTimeout(to.minutes)} style={{ paddingVertical: t.spacing.md }}>
                <Text variant="body">{tr(`groupInfo.${to.key}`)}</Text>
              </Pressable>
            ))}
            {actionMember && mutedNow(actionMember) ? (
              <Pressable onPress={() => doTimeout(0)} style={{ paddingVertical: t.spacing.md }}>
                <Text variant="body" style={{ color: t.colors.primary }}>
                  {tr('groupInfo.timeoutClear')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={doRemove} style={{ paddingVertical: t.spacing.md }}>
              <Text variant="body" color="error" style={{ fontWeight: '600' }}>
                {tr('groupInfo.remove')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Invite */}
      <Modal visible={inviteOpen} transparent animationType="slide" onRequestClose={() => setInviteOpen(false)}>
        <Pressable onPress={() => setInviteOpen(false)} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: t.colors.card, borderTopLeftRadius: t.radius.sheet, borderTopRightRadius: t.radius.sheet, padding: t.spacing.lg, paddingBottom: t.spacing.xl, gap: t.spacing.md, maxHeight: '80%' }}
          >
            <Text variant="h3">{tr('groupInfo.inviteTitle')}</Text>
            {connections.length === 0 ? (
              <Text variant="body" color="textSecondary">
                {tr('groupInfo.noConnections')}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {connections.map((c) => {
                  const on = selected.has(c.profile.id);
                  return (
                    <Pressable
                      key={c.profile.id}
                      onPress={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.profile.id)) next.delete(c.profile.id);
                          else next.add(c.profile.id);
                          return next;
                        })
                      }
                      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.sm }}
                    >
                      {c.profile.avatar ? (
                        <Image source={{ uri: c.profile.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text variant="small" color="onPrimary" style={{ fontWeight: '700' }}>
                            {(c.profile.name ?? '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                        {c.profile.name ?? tr('community.someone')}
                      </Text>
                      <Ionicons
                        name={on ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={on ? t.colors.primary : t.colors.border}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text variant="small" style={{ fontWeight: '600' }}>
                  {tr('groupInfo.historyVisible')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {tr('groupInfo.historyHint')}
                </Text>
              </View>
              <Switch value={historyVisible} onValueChange={setHistoryVisible} />
            </View>

            <Button title={tr('groupInfo.inviteConfirm')} onPress={confirmInvite} disabled={selected.size === 0} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
