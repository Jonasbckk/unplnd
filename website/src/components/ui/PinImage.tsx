import { useState } from 'react';

/**
 * Pin, the UNPLND mascot. Assets live in /public/pin/ (provided by brand).
 * Until a file is dropped in, the slot hides itself instead of showing a
 * broken image — the page never depends on Pin for layout.
 */
export function PinImage({
  name,
  alt,
  className = '',
}: {
  name: 'pin-peek' | 'pin-wave' | 'pin-chill' | 'pin-couch';
  alt: string;
  className?: string;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <img
      src={`/pin/${name}.png`}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setMissing(true)}
      className={`pointer-events-none select-none ${className}`}
    />
  );
}
