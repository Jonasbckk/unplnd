import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Text } from '@/components/ui';
import { usePlannerStore } from '@/features/planner/planner-store';
import { canSpeak, speak, stopSpeaking, voiceStep, type VoiceTurn } from '@/features/planner/voice-service';
import { fetchIsPremium } from '@/features/profile/use-premium';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { getCurrentLocation } from '@/lib/location';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

/**
 * The voice concierge — talk your evening into existence (premium; founders always).
 * Speak (or type), the concierge asks for what's missing, and once it has enough it hands the
 * condensed request to the NORMAL plan pipeline. It never invents venues itself.
 */
export default function VoicePlannerScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const setRequest = usePlannerStore((s) => s.setRequest);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const doneRef = useRef(false);

  // Premium gate — the founder wants this to be a premium feature (founders always pass).
  useEffect(() => {
    void fetchIsPremium().then((premium) => {
      if (premium) {
        setAllowed(true);
      } else {
        setAllowed(false);
        router.replace('/paywall' as Href);
      }
    });
  }, [router]);

  // Stop talking when the screen goes away — nothing is worse than a ghost voice.
  useEffect(() => () => stopSpeaking(), []);

  const pushTurn = (turn: VoiceTurn) => {
    setTurns((cur) => [...cur, turn]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleResult = (transcript: string, reply: string, ready: boolean, request?: string) => {
    if (transcript) pushTurn({ role: 'user', text: transcript });
    pushTurn({ role: 'assistant', text: reply });
    speak(reply);
    if (ready && request && !doneRef.current) {
      doneRef.current = true;
      // Hand over to the normal pipeline — the concierge only collects, generate-plan plans.
      setRequest(request);
      setTimeout(() => {
        stopSpeaking();
        router.replace('/plan/generating');
      }, canSpeak ? 2200 : 900);
    }
  };

  const step = async (input: { audioUri?: string; text?: string }, optimisticText?: string) => {
    setBusy(true);
    stopSpeaking();
    const history = turns;
    if (optimisticText) pushTurn({ role: 'user', text: optimisticText });
    const location = await getCurrentLocation();
    const result = await voiceStep({ ...input, history, city: location?.city });
    setBusy(false);
    if (!result.ok) {
      toast(tr(result.kind === 'rate_limited' ? 'voice.rateLimited' : 'voice.failed'));
      return;
    }
    // With audio the transcript arrives from the server; typed turns are already on screen.
    handleResult(optimisticText ? '' : result.transcript, result.reply, result.ready, result.request);
  };

  const toggleRecording = async () => {
    if (busy) return;
    if (recorderState.isRecording) {
      haptics.light();
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) void step({ audioUri: uri });
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      toast(tr('voice.micDenied'));
      return;
    }
    haptics.selection();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    recorder.record();
  };

  const sendTyped = () => {
    const text = typed.trim();
    if (!text || busy) return;
    setTyped('');
    void step({ text }, text);
  };

  if (allowed !== true) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }

  const recording = recorderState.isRecording;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <Text variant="h2">{tr('voice.title')}</Text>
          <Pressable
            onPress={() => {
              stopSpeaking();
              router.back();
            }}
            hitSlop={10}
            accessibilityLabel={tr('common.close')}
          >
            <Ionicons name="close" size={26} color={t.colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md, paddingBottom: t.spacing.xl }}
      >
        {turns.length === 0 && (
          <Animated.View entering={FadeInUp.duration(400)} style={{ gap: t.spacing.sm, marginTop: t.spacing.xl }}>
            <Text variant="h1">{tr('voice.emptyTitle')}</Text>
            <Text variant="body" color="textSecondary">
              {tr('voice.emptyBody')}
            </Text>
            {!canSpeak && (
              <Text variant="caption" color="textSecondary">
                {tr('voice.noSpeech')}
              </Text>
            )}
          </Animated.View>
        )}

        {turns.map((turn, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(260)}
            style={{
              alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              backgroundColor: turn.role === 'user' ? t.colors.primary : t.colors.surfaceSecondary,
              borderRadius: t.radius.lg,
              borderBottomRightRadius: turn.role === 'user' ? 4 : t.radius.lg,
              borderBottomLeftRadius: turn.role === 'user' ? t.radius.lg : 4,
              paddingVertical: t.spacing.sm,
              paddingHorizontal: t.spacing.base,
            }}
          >
            <Text variant="body" style={{ color: turn.role === 'user' ? '#FFFFFF' : t.colors.textPrimary }}>
              {turn.text}
            </Text>
          </Animated.View>
        ))}

        {busy && (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <ActivityIndicator size="small" color={t.colors.primary} />
            <Text variant="small" color="textSecondary">
              {tr('voice.thinking')}
            </Text>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.md, gap: t.spacing.md }}>
          {/* The mic is the hero: tap to talk, tap again to send. */}
          <Pressable
            onPress={() => void toggleRecording()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={recording ? tr('voice.stop') : tr('voice.talk')}
            style={{
              alignSelf: 'center',
              width: 84,
              height: 84,
              borderRadius: 42,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: recording ? t.colors.error : t.colors.primary,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Ionicons name={recording ? 'stop' : 'mic'} size={36} color="#FFFFFF" />
          </Pressable>
          <Text variant="caption" color="textSecondary" center>
            {recording ? tr('voice.listening') : tr('voice.hint')}
          </Text>

          {/* Typed fallback — also what makes the flow testable in the simulator. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input value={typed} onChangeText={setTyped} placeholder={tr('voice.typePlaceholder')} onSubmitEditing={sendTyped} />
            </View>
            <Pressable
              onPress={sendTyped}
              disabled={!typed.trim() || busy}
              hitSlop={8}
              accessibilityLabel={tr('voice.send')}
              style={{ opacity: !typed.trim() || busy ? 0.4 : 1 }}
            >
              <Ionicons name="arrow-up-circle" size={34} color={t.colors.primary} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
