import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, FadeInUp, Input, Skeleton, StatementTitle, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  applyAsCreator,
  getMyApplication,
  getPendingApplications,
  reviewApplication,
  type ApplicationStatus,
  type PendingApplication,
} from '@/features/creator/creator';
import { getPublicProfile } from '@/lib/community';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { toast } from '@/store/toast-store';
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

/** The soft sparkles medallion that marks every creator state. */
function SparklesMedallion() {
  const t = useTheme();
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: t.radius.pill,
        backgroundColor: t.colors.primary + '1F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="sparkles" size={28} color={t.colors.primary} />
    </View>
  );
}

/**
 * Creator programme (42_ROADMAP_V2: "Creator Partnerships — Selected local creators curate
 * experiences. No influencer feed. Quality first."). One pitch, personally reviewed; founders
 * see the review queue at the bottom of this same screen.
 */
export default function CreatorScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  const [status, setStatus] = useState<'loading' | 'none' | ApplicationStatus>('loading');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getMyApplication().then((app) => {
      if (!active) return;
      if (!app) {
        setStatus('none');
        return;
      }
      setMessage(app.message);
      setStatus(app.status);
      // The approval moment deserves the success buzz — once, as the state appears.
      if (app.status === 'approved') haptics.success();
    });
    return () => {
      active = false;
    };
  }, []);

  // Founders also review here — the RPC returns empty for everyone else anyway.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getPublicProfile(userId).then((p) => {
      if (!active || !p?.isFounder) return;
      setIsFounder(true);
      void getPendingApplications().then((apps) => {
        if (active) setApplications(apps);
      });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const submit = async () => {
    const text = message.trim();
    if (text.length < 20 || submitting) return;
    setSubmitting(true);
    const ok = await applyAsCreator(text);
    setSubmitting(false);
    if (ok) {
      haptics.success();
      setStatus('pending');
    } else {
      haptics.error();
      toast(tr('creator.error'));
    }
  };

  const reopen = () => {
    // Back to the form with the previous pitch prefilled, ready to rework.
    haptics.light();
    setStatus('none');
  };

  const review = async (app: PendingApplication, approve: boolean) => {
    // One decision per application: a second tap during the round trip would hit a row the
    // RPC already closed and flash a false error right after the success haptic.
    if (reviewing) return;
    setReviewing(app.userId);
    const ok = await reviewApplication(app.userId, approve);
    setReviewing(null);
    if (!ok) {
      toast(tr('creator.error'));
      return;
    }
    haptics.success();
    setApplications((cur) => cur.filter((a) => a.userId !== app.userId));
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
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tr('location.back')}
          >
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, paddingBottom: t.spacing.xxl, gap: t.spacing.lg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <FadeInUp style={{ gap: t.spacing.sm }}>
          <StatementTitle text={tr('creator.title')} />
          <Text variant="body" color="textSecondary">
            {tr('creator.intro')}
          </Text>
        </FadeInUp>

        {status === 'loading' ? (
          <Skeleton height={160} radius={t.radius.card} />
        ) : status === 'none' ? (
          <FadeInUp index={1} style={{ gap: t.spacing.base }}>
            <Input
              label={tr('creator.formLabel')}
              placeholder={tr('creator.formPlaceholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={600}
              accessibilityLabel={tr('creator.formLabel')}
              style={{
                height: undefined,
                minHeight: 120,
                paddingTop: t.spacing.md,
                paddingBottom: t.spacing.md,
                textAlignVertical: 'top',
              }}
            />
            <Button
              title={tr('creator.submit')}
              onPress={() => void submit()}
              loading={submitting}
              disabled={message.trim().length < 20}
            />
          </FadeInUp>
        ) : status === 'pending' ? (
          <FadeInUp index={1}>
            <Card style={{ alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl }}>
              <SparklesMedallion />
              <Text variant="h2" center>
                {tr('creator.pendingTitle')}
              </Text>
              <Text variant="body" color="textSecondary" center>
                {tr('creator.pendingBody')}
              </Text>
            </Card>
          </FadeInUp>
        ) : status === 'approved' ? (
          <FadeInUp index={1}>
            <Card style={{ alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.xl }}>
              <SparklesMedallion />
              {/* The badge exactly as their profile now wears it. */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: t.colors.primary + '26',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: t.radius.pill,
                }}
              >
                <Ionicons name="sparkles" size={12} color={t.colors.primary} />
                <Text variant="caption" style={{ color: t.colors.primary, fontWeight: '700', letterSpacing: 0.3 }}>
                  {tr('profile.creatorBadge')}
                </Text>
              </View>
              <Text variant="h2" center>
                {tr('creator.approvedTitle')}
              </Text>
              <Text variant="body" color="textSecondary" center>
                {tr('creator.approvedBody')}
              </Text>
            </Card>
          </FadeInUp>
        ) : (
          <FadeInUp index={1} style={{ gap: t.spacing.base }}>
            <Card style={{ gap: t.spacing.sm }}>
              <Text variant="h3">{tr('creator.declinedTitle')}</Text>
              <Text variant="body" color="textSecondary">
                {tr('creator.declinedBody')}
              </Text>
            </Card>
            <Button title={tr('creator.reapply')} onPress={reopen} />
          </FadeInUp>
        )}

        {isFounder && (
          <FadeInUp index={2} style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: t.colors.primary }} />
              <Text variant="h3">{tr('creator.reviewTitle')}</Text>
            </View>
            {applications.length === 0 ? (
              <Text variant="small" color="textSecondary">
                {tr('creator.reviewEmpty')}
              </Text>
            ) : (
              applications.map((app) => {
                const name = app.displayName || tr('community.someone') || '?';
                return (
                  <Card key={app.userId} style={{ gap: t.spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base }}>
                      <Avatar uri={app.photoUrl} name={name} />
                      <Text variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
                        {name}
                      </Text>
                    </View>
                    <Text variant="body" color="textSecondary">
                      {app.message}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          title={tr('creator.approve')}
                          loading={reviewing === app.userId}
                          disabled={reviewing !== null}
                          onPress={() => void review(app, true)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          title={tr('creator.decline')}
                          variant="secondary"
                          disabled={reviewing !== null}
                          onPress={() => void review(app, false)}
                        />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </FadeInUp>
        )}
      </ScrollView>
    </View>
  );
}
