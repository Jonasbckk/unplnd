import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ChatCircleIcon, HeartIcon } from '@phosphor-icons/react';

/**
 * "Viral feed" — 10s loop, 1080×1500 @30fps. Three UNPLND clips swipe
 * through like a short-video feed: hearts burst up the side, comments
 * slide in, then the next clip swipes up. Slot 4 duplicates slot 1 so the
 * loop seam is invisible. Plain <img> on purpose (see RouteReveal note).
 */

const W = 1080;
const H = 1500;
const CLIP_FRAMES = 100;

const CLIPS = [
  {
    seed: 'unplnd-feed-rooftop',
    caption: 'POV: Keiner hat einen Plan',
    comments: ['Wo ist das??', 'Freitag. Safe.'],
  },
  {
    seed: 'unplnd-feed-neon',
    caption: '3 Spots, 1 Route, 0 Diskussion',
    comments: ['Route bitte!', 'Genau sowas brauchen wir'],
  },
  {
    seed: 'unplnd-feed-friends',
    caption: 'Euer Freitag, sortiert.',
    comments: ['Wir gestern', 'Okay ich bin dabei'],
  },
] as const;

const HEARTS = [0, 1, 2, 3, 4, 5] as const;

export const ViralFeed = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clipIndex = Math.floor(frame / CLIP_FRAMES);
  const local = frame % CLIP_FRAMES;
  // swipe to the next clip during the last 14 frames of each slot
  const swipe = interpolate(local, [86, 99], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  });
  const feedY = -(clipIndex + swipe) * H;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#171412',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: "'Inter Variable', Inter, system-ui, sans-serif",
      }}
    >
      {/* the feed strip: 3 clips + duplicate of clip 1 for a seamless loop */}
      <div style={{ position: 'absolute', inset: 0, translate: `0px ${feedY}px` }}>
        {[...CLIPS, CLIPS[0]].map((clip, slot) => (
          <Clip
            key={slot}
            clip={clip}
            top={slot * H}
            localFrame={slot === clipIndex ? local : slot === clipIndex + 1 ? 0 : -1}
            fps={fps}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

function Clip({
  clip,
  top,
  localFrame,
  fps,
}: {
  clip: (typeof CLIPS)[number];
  top: number;
  localFrame: number; // -1 = inactive
  fps: number;
}) {
  const active = localFrame >= 0;
  return (
    <div style={{ position: 'absolute', top, left: 0, width: W, height: H }}>
      <img
        src={`https://picsum.photos/seed/${clip.seed}/720/1000`}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#2A2522',
        }}
      />
      {/* legibility gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(23,20,18,0.18) 0%, rgba(23,20,18,0) 30%, rgba(23,20,18,0) 55%, rgba(23,20,18,0.72) 100%)',
        }}
      />

      {/* floating hearts */}
      {active &&
        HEARTS.map((i) => {
          const t = localFrame - 16 - i * 7;
          if (t < 0) return null;
          const pop = spring({ frame: t, fps, config: { damping: 11, stiffness: 160 } });
          const rise = interpolate(t, [0, 58], [0, -300], { extrapolateRight: 'clamp' });
          const fade = interpolate(t, [0, 6, 40, 58], [0, 1, 0.9, 0], {
            extrapolateRight: 'clamp',
          });
          const drift = Math.sin(t / 7 + i * 1.7) * 26;
          const size = 52 + (i % 3) * 16;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                right: 90 - drift,
                top: 1010 + rise,
                opacity: fade,
                scale: String(0.5 + pop * 0.5),
                rotate: `${drift / 2.5}deg`,
              }}
            >
              <HeartIcon size={size} weight="fill" color={i % 2 ? '#FF6B5A' : '#FF4D67'} />
            </div>
          );
        })}

      {/* incoming comments */}
      {active &&
        clip.comments.map((text, i) => {
          const t = localFrame - 34 - i * 20;
          if (t < 0) return null;
          const inSpring = spring({ frame: t, fps, config: { damping: 15, stiffness: 130 } });
          return (
            <div
              key={text}
              style={{
                position: 'absolute',
                left: 64,
                top: 1046 + i * 104,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backgroundColor: 'rgba(255,253,252,0.94)',
                borderRadius: 999,
                padding: '16px 30px 16px 16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                opacity: Math.min(1, inSpring * 1.3),
                translate: `${(1 - inSpring) * -70}px 0px`,
              }}
            >
              <img
                src={`https://i.pravatar.cc/64?img=${20 + i * 13}`}
                alt=""
                style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: '#E7D3C8' }}
              />
              <span style={{ fontSize: 27, fontWeight: 600, color: '#3A2F2A' }}>{text}</span>
            </div>
          );
        })}

      {/* caption */}
      <div style={{ position: 'absolute', left: 64, right: 200, bottom: 88 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 14,
          }}
        >
          <img
            src="/brand/logo-mark.png"
            alt=""
            style={{ width: 54, height: 54, borderRadius: 999, backgroundColor: '#FFFDFC' }}
          />
          <span style={{ fontSize: 30, fontWeight: 700, color: '#FFFDFC' }}>@unplnd.com</span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, color: '#F8F3EF', letterSpacing: -0.3 }}>
          {clip.caption}
        </div>
      </div>

      {/* comment affordance, bottom right */}
      <div style={{ position: 'absolute', right: 74, bottom: 96, opacity: 0.92 }}>
        <ChatCircleIcon size={64} weight="fill" color="#FFFDFC" />
      </div>
    </div>
  );
}
