import { LoopPlayer } from './LoopPlayer';
import { LogoWink, LOGO_WINK_DURATION } from './remotion/LogoWink';

/** Lazy chunk: the living Ü logo that closes the page. */
export default function FooterPlayer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <LoopPlayer
      component={LogoWink}
      durationInFrames={LOGO_WINK_DURATION}
      width={1080}
      height={430}
      stillFrame={20}
      reducedMotion={reducedMotion}
    />
  );
}
