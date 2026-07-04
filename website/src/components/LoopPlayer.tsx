import { useEffect, useRef, type ComponentType } from 'react';
import { Player, type PlayerRef } from '@remotion/player';

/**
 * Shared decorative loop player. Playback is driven by our own rAF loop
 * via seekTo() instead of the player's autoPlay: autoPlay proved to
 * silently stay on frame 0 in some mount orders, while seekTo renders
 * deterministically. rAF also pauses in background tabs and resumes on
 * focus for free. Reduced motion pins a meaningful still frame.
 */
export function LoopPlayer({
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  stillFrame,
  reducedMotion,
}: {
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps?: number;
  width: number;
  height: number;
  stillFrame: number;
  reducedMotion: boolean;
}) {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (reducedMotion) {
      player.seekTo(stillFrame);
      return;
    }
    let rafId = 0;
    let start: number | null = null;
    let lastFrame = -1;
    const tick = (t: number) => {
      if (start === null) start = t;
      const frame = Math.floor(((t - start) / 1000) * fps) % durationInFrames;
      if (frame !== lastFrame) {
        lastFrame = frame;
        playerRef.current?.seekTo(frame);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion, durationInFrames, fps, stillFrame]);

  return (
    <Player
      ref={playerRef}
      component={component}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={width}
      compositionHeight={height}
      autoPlay={false}
      initialFrame={reducedMotion ? stillFrame : 0}
      loop={false}
      controls={false}
      clickToPlay={false}
      acknowledgeRemotionLicense
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
