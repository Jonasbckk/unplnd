import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Button, Input, Text } from '@/components/ui';
import {
  pickStopPhoto,
  publishCustomPlan,
  type CustomStopInput,
} from '@/features/plans/create-plan';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORIES: { key: string; icon: IoniconName }[] = [
  { key: 'food', icon: 'restaurant-outline' },
  { key: 'drinks', icon: 'wine-outline' },
  { key: 'cafe', icon: 'cafe-outline' },
  { key: 'culture', icon: 'color-palette-outline' },
  { key: 'nature', icon: 'leaf-outline' },
  { key: 'nightlife', icon: 'moon-outline' },
  { key: 'activity', icon: 'basketball-outline' },
  { key: 'other', icon: 'ellipsis-horizontal' },
];

function emptyStop(): CustomStopInput {
  return { time: '', title: '', reason: '', category: 'other', imageUri: undefined };
}

export default function CreatePlanScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [stops, setStops] = useState<CustomStopInput[]>([emptyStop()]);
  const [rightsOk, setRightsOk] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const updateStop = (index: number, patch: Partial<CustomStopInput>) =>
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addStop = () => {
    haptics.light();
    setStops((prev) => [...prev, emptyStop()]);
  };

  const removeStop = (index: number) => {
    haptics.light();
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const pickFor = async (index: number) => {
    const asset = await pickStopPhoto();
    if (asset) updateStop(index, { imageUri: asset.uri });
  };

  const hasPhoto = stops.some((s) => s.imageUri);
  const canPublish = useMemo(
    () => title.trim().length > 0 && stops.some((s) => s.title.trim().length > 0) && hasPhoto && rightsOk,
    [title, stops, hasPhoto, rightsOk],
  );

  const onPublish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    const result = await publishCustomPlan({ title, city, note, stops });
    setPublishing(false);
    if (!result.ok) {
      toast(
        result.reason === 'no_photos'
          ? tr('createPlan.errNoPhotos')
          : result.reason === 'invalid'
            ? tr('createPlan.errInvalid')
            : tr('createPlan.errFailed'),
      );
      return;
    }
    haptics.success();
    toast(tr('createPlan.published'));
    router.replace(`/community/${result.id}` as Href);
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
          <Text variant="h2">{tr('createPlan.title')}</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.base, paddingBottom: t.spacing.xxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="bodyLarge" color="textSecondary" style={{ marginBottom: t.spacing.xs }}>
            {tr('createPlan.intro')}
          </Text>

          <Input
            label={tr('createPlan.planTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={tr('createPlan.planTitlePh')}
          />
          <Input
            label={tr('createPlan.city')}
            value={city}
            onChangeText={setCity}
            placeholder={tr('createPlan.cityPh')}
          />
          <Input
            label={tr('createPlan.note')}
            value={note}
            onChangeText={setNote}
            placeholder={tr('createPlan.notePh')}
            multiline
            style={{ height: 92, paddingTop: t.spacing.md, textAlignVertical: 'top' }}
          />

          <Text variant="h3" style={{ marginTop: t.spacing.sm }}>
            {tr('createPlan.stopsTitle')}
          </Text>

          {stops.map((stop, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(260)}
              style={{
                backgroundColor: t.colors.card,
                borderRadius: t.radius.card,
                padding: t.spacing.base,
                gap: t.spacing.md,
                ...t.shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="small" color="textSecondary" style={{ fontWeight: '700', letterSpacing: 0.5 }}>
                  {tr('createPlan.stopN', { n: i + 1 }).toUpperCase()}
                </Text>
                {stops.length > 1 && (
                  <Pressable onPress={() => removeStop(i)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={t.colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              <Pressable onPress={() => pickFor(i)}>
                {stop.imageUri ? (
                  <View style={{ borderRadius: t.radius.md, overflow: 'hidden' }}>
                    <Image source={{ uri: stop.imageUri }} style={{ width: '100%', height: 150 }} contentFit="cover" />
                    <View
                      style={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: t.radius.pill,
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={13} color="#FFFFFF" />
                      <Text variant="small" style={{ color: '#FFFFFF' }}>
                        {tr('createPlan.changePhoto')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      height: 150,
                      borderRadius: t.radius.md,
                      borderWidth: 1.5,
                      borderColor: t.colors.border,
                      borderStyle: 'dashed',
                      backgroundColor: t.colors.surfaceSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="camera-outline" size={26} color={t.colors.textSecondary} />
                    <Text variant="small" color="textSecondary">
                      {tr('createPlan.addPhoto')}
                    </Text>
                  </View>
                )}
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: t.spacing.sm }}
                keyboardShouldPersistTaps="handled"
              >
                {CATEGORIES.map((cat) => {
                  const selected = stop.category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => updateStop(i, { category: cat.key })}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: t.radius.pill,
                        backgroundColor: selected ? t.colors.primary : t.colors.surfaceSecondary,
                      }}
                    >
                      <Ionicons name={cat.icon} size={14} color={selected ? '#FFFFFF' : t.colors.textSecondary} />
                      <Text variant="small" style={{ color: selected ? '#FFFFFF' : t.colors.textPrimary }}>
                        {tr(`createPlan.cat.${cat.key}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                <View style={{ width: 96 }}>
                  <Input
                    label={tr('createPlan.time')}
                    value={stop.time}
                    onChangeText={(v) => updateStop(i, { time: v })}
                    placeholder="20:00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={tr('createPlan.place')}
                    value={stop.title}
                    onChangeText={(v) => updateStop(i, { title: v })}
                    placeholder={tr('createPlan.placePh')}
                  />
                </View>
              </View>

              <Input
                label={tr('createPlan.why')}
                value={stop.reason}
                onChangeText={(v) => updateStop(i, { reason: v })}
                placeholder={tr('createPlan.whyPh')}
                multiline
                style={{ height: 80, paddingTop: t.spacing.md, textAlignVertical: 'top' }}
              />
            </Animated.View>
          ))}

          <Button title={tr('createPlan.addStop')} variant="secondary" onPress={addStop} />

          {/* Rights notice — the user provides their own images and is responsible for them. */}
          <View
            style={{
              backgroundColor: t.colors.surfaceSecondary,
              borderRadius: t.radius.card,
              padding: t.spacing.base,
              gap: t.spacing.sm,
              marginTop: t.spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={t.colors.primary} />
              <Text variant="body" style={{ fontWeight: '600', flex: 1 }}>
                {tr('createPlan.rightsTitle')}
              </Text>
            </View>
            <Text variant="small" color="textSecondary">
              {tr('createPlan.rightsBody')}
            </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                setRightsOk((v) => !v);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginTop: t.spacing.xs }}
            >
              <Ionicons
                name={rightsOk ? 'checkbox' : 'square-outline'}
                size={24}
                color={rightsOk ? t.colors.primary : t.colors.textSecondary}
              />
              <Text variant="small" style={{ flex: 1 }}>
                {tr('createPlan.rightsConfirm')}
              </Text>
            </Pressable>
          </View>

          <Button
            title={publishing ? tr('createPlan.publishing') : tr('createPlan.publish')}
            onPress={onPublish}
            disabled={!canPublish || publishing}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
