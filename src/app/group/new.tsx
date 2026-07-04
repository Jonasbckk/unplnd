import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, Input, Text } from '@/components/ui';
import { getConnections, type ConnectionEntry } from '@/lib/connections';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { createGroup } from '@/lib/messaging';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

export default function NewGroupScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [connections, setConnections] = useState<ConnectionEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    void getConnections().then((c) => {
      if (!active) return;
      setConnections(c);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (id: string) => {
    haptics.selection();
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (!title.trim() || selected.size === 0) return;
    setCreating(true);
    const convId = await createGroup(title, [...selected]);
    setCreating(false);
    if (convId) {
      haptics.success();
      router.replace(`/chat/${convId}` as Href);
    } else {
      toast(tr('group.failed'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.sm,
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
          <Text variant="h2">{tr('group.title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.lg }} showsVerticalScrollIndicator={false}>
        <Input value={title} onChangeText={setTitle} placeholder={tr('group.namePlaceholder')} autoCapitalize="sentences" maxLength={40} />

        <View style={{ gap: t.spacing.sm }}>
          <Text variant="h3">{tr('group.pickPeople')}</Text>
          {!loading && connections.length === 0 ? (
            <EmptyState icon="people-outline" title={tr('connections.emptyTitle')} body={tr('group.needConnections')} />
          ) : (
            connections.map((entry) => {
              const sel = selected.has(entry.profile.id);
              const name = entry.profile.name || tr('community.someone') || '?';
              return (
                <Pressable
                  key={entry.profile.id}
                  onPress={() => toggle(entry.profile.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.sm }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: t.radius.pill,
                      backgroundColor: t.colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {entry.profile.avatar ? (
                      <Image source={{ uri: entry.profile.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                      <Text variant="h3" color="onPrimary">
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text variant="body" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Ionicons
                    name={sel ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={sel ? t.colors.primary : t.colors.border}
                  />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={{ padding: t.spacing.lg, paddingBottom: t.spacing.xl, borderTopWidth: 1, borderTopColor: t.colors.divider }}>
        <Button
          title={tr('group.create')}
          loading={creating}
          disabled={!title.trim() || selected.size === 0}
          onPress={create}
        />
      </View>
    </View>
  );
}
