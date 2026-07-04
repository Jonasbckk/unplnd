import type { ReactNode } from 'react';

/**
 * Device frame for live product previews. The screen content is a real
 * mini render of the app UI (same tokens as src/theme in the app repo),
 * presented as one image for assistive tech — nothing inside is a fake
 * interactive control.
 */
export function PhoneMockup({
  children,
  label,
  className = '',
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative w-[280px] shrink-0 sm:w-[300px] ${className}`}
    >
      {/* bezel */}
      <div className="rounded-[46px] bg-[#26201c] p-[10px] shadow-warm-xl ring-1 ring-white/25">
        {/* screen */}
        <div
          aria-hidden
          className="relative aspect-[9/19] overflow-hidden rounded-[36px] bg-bg"
        >
          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#26201c]" />
          {children}
        </div>
      </div>
      {/* soft ground shadow */}
      <div className="absolute -bottom-6 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-[100%] bg-heading/15 blur-xl" />
    </div>
  );
}
