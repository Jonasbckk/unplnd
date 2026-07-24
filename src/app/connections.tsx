import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Input, Text } from '@/components/ui';
import {
  acceptRequest,
  getConnections,
  getIncomingRequests,
  removeConnection,
  searchUsers,
  type ConnectionEntry,
  type UserResult,
} from '@/lib/connections';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

function Avatar({ uri, name }: { uri: string | null; name: string }) {
  const t = useTheme();
  return (
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
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Text variant="h3" color="onPrimary">
          {(name || '?').charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function PersonRow({ entry, onPress, right }: { entry: ConnectionEntry; onPress?: () => void; right?: ReactNode }) {
  const t = useTheme();
  const { t: tr } = useT();
  const name = entry.profile.name || tr('community.someone') || '?';
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.sm }}
    >
      <Avatar uri={entry.profile.avatar} name={name} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
            {name}
          </Text>
          {/* Founder wins — never both badges at once. */}
          {entry.profile.isFounder ? (
            <Ionicons name="ribbon" size={14} color={t.colors.primary} />
          ) : entry.profile.isCreator ? (
            <Ionicons name="sparkles" size={14} color={t.colors.primary} />
          ) : null}
        </View>
        {entry.profile.homeCity ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {tr('profile.fromCity', { city: entry.profile.homeCity })}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

function ResultRow({ result, onPress }: { result: UserResult; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const name = result.name || tr('community.someone') || '?';
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.sm }}
    >
      <Avatar uri={result.avatar} name={name} />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
          {name}
        </Text>
        {/* Founder wins — never both badges at once. */}
        {result.isFounder ? (
          <Ionicons name="ribbon" size={14} color={t.colors.primary} />
        ) : result.isCreator ? (
          <Ionicons name="sparkles" size={14} color={t.colors.primary} />
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
    </Pressable>
  );
}

/** Connections — search people, accept requests, and the people you're connected with. */
export default function ConnectionsScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const [incoming, setIncoming] = useState<ConnectionEntry[]>([]);
  const [connections, setConnections] = useState<ConnectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const searching = query.trim().length >= 2;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void searchUsers(q).then((r) => active && setResults(r));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const load = useCallback(async () => {
    const [inc, cons] = await Promise.all([getIncomingRequests(), getConnections()]);
    setIncoming(inc);
    setConnections(cons);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const accept = async (entry: ConnectionEntry) => {
    haptics.success();
    await acceptRequest(entry.rowId);
    await load();
  };
  const decline = async (entry: ConnectionEntry) => {
    haptics.light();
    await removeConnection(entry.rowId);
    await load();
  };

  const openProfile = (entry: ConnectionEntry) =>
    router.push(`/user/${entry.profile.id}` as Href);

  const empty = !loading && incoming.length === 0 && connections.length === 0;

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
          <Text variant="h2">{tr('connections.title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} />}
      >
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={tr('connections.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching ? (
          results.length === 0 ? (
            <Text variant="small" color="textSecondary">
              {tr('connections.noResults')}
            </Text>
          ) : (
            <View style={{ gap: t.spacing.sm }}>
              {results.map((r) => (
                <ResultRow key={r.id} result={r} onPress={() => router.push(`/user/${r.id}` as Href)} />
              ))}
            </View>
          )
        ) : empty ? (
          <EmptyState icon="people-outline" title={tr('connections.emptyTitle')} body={tr('connections.emptyBody')} />
        ) : (
          <>
            {incoming.length > 0 && (
              <View style={{ gap: t.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: t.colors.primary }} />
                  <Text variant="h3">{tr('connections.requests')}</Text>
                </View>
                {incoming.map((entry) => (
                  <PersonRow
                    key={entry.rowId}
                    entry={entry}
                    onPress={() => openProfile(entry)}
                    right={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                        <Pressable onPress={() => accept(entry)} hitSlop={6}>
                          <Ionicons name="checkmark-circle" size={30} color={t.colors.primary} />
                        </Pressable>
                        <Pressable onPress={() => decline(entry)} hitSlop={6}>
                          <Ionicons name="close-circle-outline" size={28} color={t.colors.textSecondary} />
                        </Pressable>
                      </View>
                    }
                  />
                ))}
              </View>
            )}

            <View style={{ gap: t.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: t.colors.primary }} />
                <Text variant="h3">{tr('connections.yours')}</Text>
              </View>
              {connections.length === 0 ? (
                <Text variant="small" color="textSecondary">
                  {tr('connections.noneYet')}
                </Text>
              ) : (
                connections.map((entry) => (
                  <PersonRow
                    key={entry.rowId}
                    entry={entry}
                    onPress={() => openProfile(entry)}
                    right={<Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
