import { LoopPlayer } from './LoopPlayer';
import { ViralFeed } from './remotion/ViralFeed';

/** Lazy chunk: the viral feed loop for the social section. */
export default function SocialPlayer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <LoopPlayer
      component={ViralFeed}
      durationInFrames={300}
      width={1080}
      height={1500}
      stillFrame={56}
      reducedMotion={reducedMotion}
    />
  );
}
