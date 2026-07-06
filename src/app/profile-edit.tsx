import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { InterestChip } from '@/features/profile/ProfileExtras';
import { INTERESTS, MAX_INTERESTS, PROMPT_OPTIONS, PROMPTS } from '@/features/profile/profile-extras';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import {
  pickAvatar,
  updateProfileAvatar,
  updateProfileBio,
  updateProfileExtras,
  updateProfileHomeCity,
  updateProfileName,
} from '@/lib/profile';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

export default function EditProfile() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const meta = user?.user_metadata as
    | {
        display_name?: string;
        avatar_url?: string;
        bio?: string;
        home_city?: string;
        interests?: string[];
        prompts?: Record<string, string>;
      }
    | undefined;
  const [name, setName] = useState(meta?.display_name ?? '');
  const [bio, setBio] = useState(meta?.bio ?? '');
  const [homeCity, setHomeCity] = useState(meta?.home_city ?? '');
  const [interests, setInterests] = useState<string[]>(meta?.interests ?? []);
  const [promptAnswers, setPromptAnswers] = useState<Record<string, string>>(meta?.prompts ?? {});
  const [avatar, setAvatar] = useState(meta?.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (key: string) => {
    haptics.selection();
    setInterests((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : cur.length >= MAX_INTERESTS ? cur : [...cur, key],
    );
  };

  const onPickAvatar = async () => {
    const asset = await pickAvatar();
    if (!asset) return;
    setUploading(true);
    const url = await updateProfileAvatar(asset);
    setUploading(false);
    if (url) {
      setAvatar(url);
      await useAuthStore.getState().refreshUser();
      haptics.success();
      toast(tr('editProfile.avatarUpdated'));
    } else {
      toast(tr('editProfile.failed'));
    }
  };

  const onSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const okName = await updateProfileName(name);
    const okBio = await updateProfileBio(bio);
    const okCity = await updateProfileHomeCity(homeCity);
    const okExtras = await updateProfileExtras(interests, promptAnswers);
    setSaving(false);
    if (okName && okBio && okCity && okExtras) {
      await useAuthStore.getState().refreshUser();
      haptics.success();
      toast(tr('editProfile.saved'));
      router.back();
    } else {
      toast(tr('editProfile.failed'));
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
          <Text variant="h2">{tr('editProfile.title')}</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.xl, alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        <Pressable onPress={onPickAvatar} disabled={uploading}>
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text variant="displayMedium" color="onPrimary">
                {(name || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
            {uploading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 34,
              height: 34,
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.surface,
              borderWidth: 2,
              borderColor: t.colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={17} color={t.colors.primary} />
          </View>
        </Pressable>

        <View style={{ alignSelf: 'stretch', gap: t.spacing.sm }}>
          <Text variant="small" color="textSecondary">
            {tr('editProfile.nameLabel')}
          </Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={tr('editProfile.namePlaceholder')}
            autoCapitalize="words"
          />
        </View>

        <View style={{ alignSelf: 'stretch', gap: t.spacing.sm }}>
          <Text variant="small" color="textSecondary">
            {tr('editProfile.cityLabel')}
          </Text>
          <Input
            value={homeCity}
            onChangeText={setHomeCity}
            placeholder={tr('editProfile.cityPlaceholder')}
            autoCapitalize="words"
            maxLength={60}
            returnKeyType="done"
          />
        </View>

        <View style={{ alignSelf: 'stretch', gap: t.spacing.sm }}>
          <Text variant="small" color="textSecondary">
            {tr('editProfile.bioLabel')}
          </Text>
          <Input
            value={bio}
            onChangeText={setBio}
            placeholder={tr('editProfile.bioPlaceholder')}
            multiline
            maxLength={160}
            style={{ height: 92, paddingTop: t.spacing.md, textAlignVertical: 'top' }}
          />
          <Text variant="caption" color="textSecondary" style={{ alignSelf: 'flex-end' }}>
            {`${bio.length}/160`}
          </Text>
        </View>

        <View style={{ alignSelf: 'stretch', gap: t.spacing.sm }}>
          <Text variant="small" color="textSecondary">
            {tr('extras.interestsLabel', { max: MAX_INTERESTS })}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {INTERESTS.map((key) => (
              <InterestChip
                key={key}
                interestKey={key}
                accent={t.colors.primary}
                selected={interests.includes(key)}
                onPress={() => toggleInterest(key)}
              />
            ))}
          </View>
        </View>

        {PROMPTS.map((key) => (
          <View key={key} style={{ alignSelf: 'stretch', gap: t.spacing.sm }}>
            <Text variant="small" color="textSecondary">
              {tr(`prompts.${key}`)}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
              {PROMPT_OPTIONS[key].map((opt) => {
                const selected = promptAnswers[key] === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      haptics.selection();
                      setPromptAnswers((cur) => ({ ...cur, [key]: selected ? '' : opt }));
                    }}
                  >
                    <View
                      style={{
                        paddingHorizontal: t.spacing.base,
                        paddingVertical: t.spacing.sm,
                        borderRadius: t.radius.pill,
                        backgroundColor: selected ? t.colors.primary : t.colors.surfaceSecondary,
                      }}
                    >
                      <Text
                        variant="small"
                        style={{ color: selected ? '#FFFFFF' : t.colors.textPrimary, fontWeight: '600' }}
                      >
                        {tr(`promptOpts.${key}.${opt}`)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ alignSelf: 'stretch' }}>
          <Button title={tr('editProfile.save')} loading={saving} disabled={!name.trim()} onPress={onSave} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
