import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/*
 * Note: plain <img> instead of Remotion's <Img> on purpose. <Img> decodes
 * synchronously per frame and stalls the whole player when a remote photo
 * fails to decode (observed as "stuck on frame 0"). This composition only
 * ever runs in the browser <Player>, never through `remotion render`, so
 * async-loading images are fine — they get a warm placeholder underneath.
 */

/**
 * "Euer Plan steht." — 8s loop, 1080×1350 @30fps.
 * A real example evening (Späti → Park → Bowling → Jazzbar) draws itself
 * across a warm map, each stop pops in as a photo card. All motion is
 * frame-driven (interpolate/spring) — no CSS animations, per Remotion rules.
 */

const CREAM = '#F9F4EF';
const INK = '#3A2F2A';
const INK_SOFT = '#6F645D';
const COFFEE = '#6D4C41';
const SURFACE = '#FFFDFC';
const LINE = '#ECE5DE';

type Stop = {
  x: number;
  y: number;
  time: string;
  label: string;
  seed: string;
  color: string;
  at: number;
  side: 'left' | 'right';
};

const STOPS: Stop[] = [
  { x: 170, y: 1150, time: '18:00', label: 'Späti-Run', seed: 'unplnd-spaeti-drinks', color: '#FF6B5A', at: 22, side: 'right' },
  { x: 450, y: 890, time: '18:45', label: 'Park & Musik', seed: 'unplnd-park-golden-hour', color: '#E88C5A', at: 60, side: 'left' },
  { x: 660, y: 610, time: '21:00', label: 'Bowling', seed: 'unplnd-bowling-alley', color: '#F2B84B', at: 98, side: 'right' },
  { x: 900, y: 300, time: '23:00', label: 'Jazzbar', seed: 'unplnd-jazz-bar-night', color: '#C97B63', at: 136, side: 'left' },
];

const ROUTE_D =
  'M 170 1150 C 320 1110, 390 990, 450 890 C 520 780, 575 710, 660 610 C 760 490, 815 405, 900 300';

/* faint background "streets" for a map feel */
const STREETS = [
  'M -40 420 C 240 380, 520 470, 1120 350',
  'M -40 820 C 300 760, 640 880, 1120 780',
  'M 320 1390 C 380 1040, 300 660, 520 -40',
  'M 760 1390 C 860 1000, 700 560, 980 -40',
];

export const RouteReveal = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // soft fade at the loop seam
  const loopFade = interpolate(frame, [durationInFrames - 14, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const draw = interpolate(frame, [14, 150], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

  const outroPop = spring({ frame: frame - 176, fps, config: { damping: 16, stiffness: 130 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "'Inter Variable', Inter, system-ui, sans-serif",
        opacity: loopFade,
      }}
    >
      {/* ambient warmth */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(620px 480px at 82% 14%, rgba(232,140,90,0.16), transparent 70%), radial-gradient(560px 440px at 8% 94%, rgba(201,123,99,0.13), transparent 70%)',
        }}
      />

      {/* map background + route */}
      <svg viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0 }} fill="none">
        <defs>
          <linearGradient
            id="route"
            x1="170"
            y1="1150"
            x2="900"
            y2="300"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FF6B5A" />
            <stop offset="0.55" stopColor="#E88C5A" />
            <stop offset="1" stopColor="#F2B84B" />
          </linearGradient>
        </defs>
        {STREETS.map((d) => (
          <path key={d} d={d} stroke={LINE} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
        ))}
        {/* faint full track */}
        <path d={ROUTE_D} stroke={LINE} strokeWidth={15} strokeLinecap="round" />
        {/* drawn route */}
        <path
          d={ROUTE_D}
          stroke="url(#route)"
          strokeWidth={15}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw}
        />
      </svg>

      {/* title */}
      <div
        style={{
          position: 'absolute',
          top: 88,
          left: 92,
          opacity: titleIn,
          translate: `0px ${(1 - titleIn) * 26}px`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: INK_SOFT, marginBottom: 8 }}>
          Heute, ab 18:00
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, color: COFFEE, letterSpacing: -2 }}>
          Euer Plan steht.
        </div>
      </div>

      {/* stops */}
      {STOPS.map((s) => {
        const pop = spring({ frame: frame - s.at, fps, config: { damping: 13, stiffness: 140 } });
        const chipIn = spring({
          frame: frame - s.at - 6,
          fps,
          config: { damping: 15, stiffness: 120 },
        });
        return (
          <div key={s.label}>
            {/* route dot */}
            <div
              style={{
                position: 'absolute',
                left: s.x - 22,
                top: s.y - 22,
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: s.color,
                border: `8px solid ${SURFACE}`,
                boxShadow: '0 10px 24px rgba(109,76,65,0.22)',
                scale: String(0.5 + Math.min(1, pop) * 0.5),
                opacity: Math.min(1, pop * 1.4),
              }}
            />
            {/* photo chip */}
            <div
              style={{
                position: 'absolute',
                left: s.side === 'right' ? s.x + 48 : undefined,
                right: s.side === 'left' ? 1080 - s.x + 48 : undefined,
                top: s.y - 48,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backgroundColor: SURFACE,
                borderRadius: 26,
                padding: '13px 24px 13px 13px',
                boxShadow: '0 14px 34px rgba(109,76,65,0.16)',
                opacity: Math.min(1, chipIn * 1.3),
                translate: `0px ${(1 - chipIn) * 20}px`,
                scale: String(0.92 + Math.min(1, chipIn) * 0.08),
              }}
            >
              <img
                src={`https://picsum.photos/seed/${s.seed}/128/128`}
                alt=""
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 20,
                  objectFit: 'cover',
                  backgroundColor: `${s.color}33`, // warm placeholder while loading
                }}
              />
              <div>
                <div style={{ fontSize: 27, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 21, fontWeight: 600, color: s.color, marginTop: 3 }}>
                  {s.time}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* sign-off — bottom right, clear of the route's starting stop */}
      <div
        style={{
          position: 'absolute',
          right: 92,
          bottom: 84,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          opacity: Math.min(1, outroPop * 1.3),
          translate: `0px ${(1 - outroPop) * 24}px`,
        }}
      >
        <img src="/brand/logo-mark.png" alt="" style={{ width: 80, height: 80 }} />
        <div>
          <div style={{ fontSize: 33, fontWeight: 700, color: COFFEE, letterSpacing: -0.5 }}>
            Plan less. Live more.
          </div>
          <div style={{ fontSize: 23, fontWeight: 500, color: INK_SOFT, marginTop: 4 }}>
            Fertig, bevor alle da sind.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
