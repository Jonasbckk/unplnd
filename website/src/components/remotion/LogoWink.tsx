import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * The Ü logo as a living character — floats gently, blinks twice per loop,
 * warm sparks drift up around it. Transparent background so it sits on the
 * footer surface in both light and dark mode. Seamless 6s loop: all motion
 * is periodic in `frame` (sin with whole periods, symmetric blink events).
 */

const CORAL = '#FF6B5A';
const SUNSET = '#E88C5A';
const HONEY = '#F2B84B';

const DURATION = 180; // 6s @ 30fps

/** 0→1→0 blink curve around a center frame */
function blink(frame: number, center: number) {
  return interpolate(frame, [center - 5, center, center + 5], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

const SPARKS = [
  { x: 330, cycle: 0, tone: SUNSET, size: 13 },
  { x: 705, cycle: 0.33, tone: HONEY, size: 10 },
  { x: 385, cycle: 0.55, tone: HONEY, size: 9 },
  { x: 660, cycle: 0.78, tone: CORAL, size: 12 },
] as const;

export const LogoWink = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // one full float cycle per loop → seamless
  const t = (frame / durationInFrames) * Math.PI * 2;
  const floatY = Math.sin(t) * 12;
  const tilt = Math.sin(t + Math.PI / 3) * 1.6;

  // two blinks, placed symmetrically inside the loop
  const b = Math.max(blink(frame, 52), blink(frame, 138));
  const eyeScaleY = 1 - b * 0.88;
  // the smile widens a touch while blinking (cheeky, not cartoonish)
  const smileStretch = 1 + b * 0.05;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* rising sparks */}
      {SPARKS.map((s) => {
        const p = ((frame / durationInFrames) + s.cycle) % 1; // 0→1 per loop
        const y = interpolate(p, [0, 1], [330, 90]);
        const o = interpolate(p, [0, 0.18, 0.72, 1], [0, 0.85, 0.55, 0]);
        return (
          <div
            key={s.x + s.tone}
            style={{
              position: 'absolute',
              left: s.x,
              top: y,
              width: s.size,
              height: s.size,
              borderRadius: 999,
              backgroundColor: s.tone,
              opacity: o,
            }}
          />
        );
      })}

      {/* the face */}
      <svg
        width={430}
        height={330}
        viewBox="0 0 430 330"
        fill="none"
        style={{ translate: `0px ${floatY}px`, rotate: `${tilt}deg` }}
      >
        <defs>
          <linearGradient id="lw-left" x1="90" y1="40" x2="150" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor={CORAL} />
            <stop offset="1" stopColor={SUNSET} />
          </linearGradient>
          <linearGradient id="lw-right" x1="280" y1="40" x2="345" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor={SUNSET} />
            <stop offset="1" stopColor={HONEY} />
          </linearGradient>
          <linearGradient id="lw-smile" x1="95" y1="140" x2="340" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor={CORAL} />
            <stop offset="0.55" stopColor={SUNSET} />
            <stop offset="1" stopColor={HONEY} />
          </linearGradient>
        </defs>

        {/* eyes — scaleY around their own centers for the blink */}
        <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: '122px 78px' }}>
          <circle cx="122" cy="78" r="38" fill="url(#lw-left)" />
        </g>
        <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: '308px 78px' }}>
          <circle cx="308" cy="78" r="38" fill="url(#lw-right)" />
        </g>

        {/* the Ü smile */}
        <g style={{ transform: `scaleX(${smileStretch})`, transformOrigin: '215px 220px' }}>
          <path
            d="M 122 160 L 122 212 C 122 264 163 292 215 292 C 267 292 308 264 308 212 L 308 160"
            stroke="url(#lw-smile)"
            strokeWidth="62"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const LOGO_WINK_DURATION = DURATION;
