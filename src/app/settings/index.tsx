import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SegmentedControl, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

const SUPPORT_EMAIL = 'info@unplnd.com';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="small" color="textSecondary" style={{ letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          { backgroundColor: t.colors.card, borderRadius: t.radius.card, paddingHorizontal: t.spacing.base },
          t.shadows.sm,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({ label, right, onPress }: { label: string; right?: ReactNode; onPress?: () => void }) {
  const t = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, minHeight: 52 }}>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {right}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

export default function SettingsScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const languagePreference = useAppStore((s) => s.languagePreference);
  const setLanguagePreference = useAppStore((s) => s.setLanguagePreference);
  const notificationPrefs = useAppStore((s) => s.notificationPrefs);
  const setNotificationPref = useAppStore((s) => s.setNotificationPref);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const email = useAuthStore((s) => s.user?.email);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [deleting, setDeleting] = useState(false);

  const switchColors = { false: t.colors.border, true: t.colors.primary };

  const contactSupport = () => {
    const version = Constants.expoConfig?.version ?? '1.0.0';
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`UNPLND ${version}`)}`);
  };

  const onDeleteAccount = async () => {
    const ok = await confirmDialog(
      tr('settings.deleteAccountTitle'),
      tr('settings.deleteAccountBody'),
      tr('settings.deleteAccountConfirm'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(tr('settings.deleteAccountError'));
      } else {
        Alert.alert(tr('settings.deleteAccountError'));
      }
      return;
    }
    haptics.success();
    // On success the session clears → the root layout redirects to auth automatically.
  };

  const notificationRows: { key: keyof typeof notificationPrefs; label: string }[] = [
    { key: 'eveningReminders', label: tr('settings.eveningReminders') },
    { key: 'albumReady', label: tr('settings.albumReady') },
    { key: 'weatherChanges', label: tr('settings.weatherChanges') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, padding: t.spacing.lg }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name={'chevron-back' as IoniconName} size={26} color={t.colors.textHeading} />
          </Pressable>
          <Text variant="h1">{tr('settings.title')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          <Section title={tr('settings.appearance')}>
            <View style={{ paddingVertical: t.spacing.base, gap: t.spacing.md }}>
              <Text variant="body">{tr('settings.theme')}</Text>
              <SegmentedControl
                value={themePreference}
                onChange={setThemePreference}
                options={[
                  { label: tr('settings.light'), value: 'light' },
                  { label: tr('settings.dark'), value: 'dark' },
                  { label: tr('settings.system'), value: 'system' },
                ]}
              />
            </View>
          </Section>

          <Section title={tr('settings.language')}>
            <View style={{ paddingVertical: t.spacing.base, gap: t.spacing.md }}>
              <SegmentedControl
                value={languagePreference}
                onChange={setLanguagePreference}
                options={[
                  { label: 'Deutsch', value: 'de' },
                  { label: 'English', value: 'en' },
                  { label: tr('settings.system'), value: 'system' },
                ]}
              />
            </View>
          </Section>

          <Section title={tr('settings.notifications')}>
            {notificationRows.map((row) => (
              <Row
                key={row.key}
                label={row.label}
                right={
                  <Switch
                    value={notificationPrefs[row.key]}
                    onValueChange={(v) => setNotificationPref(row.key, v)}
                    trackColor={switchColors}
                    thumbColor="#FFFFFF"
                  />
                }
              />
            ))}
          </Section>

          <Section title={tr('settings.account')}>
            <Row label={tr('settings.email')} right={<Text variant="small" color="textSecondary">{email ?? '—'}</Text>} />
          </Section>

          <Section title={tr('settings.support')}>
            <Row
              label={tr('settings.contactSupport')}
              onPress={contactSupport}
              right={<Ionicons name={'mail-outline' as IoniconName} size={18} color={t.colors.textSecondary} />}
            />
          </Section>

          <Section title={tr('settings.about')}>
            <Row
              label={tr('settings.version')}
              right={
                <Text variant="small" color="textSecondary">
                  {Constants.expoConfig?.version ?? '1.0.0'}
                </Text>
              }
            />
          </Section>

          {__DEV__ && (
            <Section title="Developer">
              <Row
                label="Onboarding erneut ansehen"
                onPress={() => {
                  resetOnboarding();
                  router.replace('/onboarding');
                }}
                right={<Ionicons name={'refresh-outline' as IoniconName} size={18} color={t.colors.textSecondary} />}
              />
            </Section>
          )}

          <Button title={tr('settings.signOut')} variant="secondary" onPress={signOut} />

          <Pressable onPress={onDeleteAccount} disabled={deleting} style={{ paddingVertical: t.spacing.md }}>
            <Text variant="small" center style={{ color: t.colors.error, opacity: deleting ? 0.5 : 1 }}>
              {tr('settings.deleteAccount')}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
