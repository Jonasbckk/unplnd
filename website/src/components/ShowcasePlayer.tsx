import { LoopPlayer } from './LoopPlayer';
import { RouteReveal } from './remotion/RouteReveal';

/** Lazy chunk: route animation for the "Gruppenchat" showcase. */
export default function ShowcasePlayer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <LoopPlayer
      component={RouteReveal}
      durationInFrames={240}
      width={1080}
      height={1350}
      stillFrame={172}
      reducedMotion={reducedMotion}
    />
  );
}
