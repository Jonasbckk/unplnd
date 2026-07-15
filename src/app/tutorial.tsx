import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

// expo-video is a native module: on a build that predates it, a top-level import would crash at
// module load (same story as the app icons). Require defensively and show a friendly fallback —
// once the next build ships, the player just appears.
type VideoModule = typeof import('expo-video');
let videoMod: VideoModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  videoMod = require('expo-video') as VideoModule;
} catch {
  videoMod = null;
}

// Bundled with the app (2.6 MB) — plays offline, no hosting, no loading spinner.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TUTORIAL_VIDEO = require('../../assets/videos/tutorial.mp4') as number;

/** Inner component so the expo-video hook is only ever called when the module exists. */
function Player({ mod }: { mod: VideoModule }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const player = mod.useVideoPlayer(TUTORIAL_VIDEO, (p) => {
    p.loop = true;
    p.play();
  });
  // 9:16 video, sized to leave room for the title above.
  const w = Math.min(width - t.spacing.lg * 2, 430);
  return (
    <View
      style={{
        alignSelf: 'center',
        width: w,
        aspectRatio: 9 / 16,
        borderRadius: t.radius.card,
        overflow: 'hidden',
        backgroundColor: '#131110',
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    >
      <mod.VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

/** Settings → Tutorial: how to build your own evening and share it with the community. */
export default function TutorialScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();

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
          <Text variant="h2">{tr('tutorial.title')}</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={tr('common.close')}>
            <Ionicons name="close" size={26} color={t.colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, paddingHorizontal: t.spacing.lg, gap: t.spacing.md }}>
        <Text variant="body" color="textSecondary">
          {tr('tutorial.body')}
        </Text>

        {videoMod ? (
          <Player mod={videoMod} />
        ) : (
          <Card style={{ gap: t.spacing.sm }}>
            <Ionicons name="film-outline" size={26} color={t.colors.primary} />
            <Text variant="body" color="textSecondary">
              {tr('tutorial.unavailable')}
            </Text>
          </Card>
        )}
      </View>
    </View>
  );
}
