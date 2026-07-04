import { Suspense, lazy, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { Reveal } from './ui/Reveal';

const ShowcasePlayer = lazy(() => import('./ShowcasePlayer'));

export function Showcase() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  // mount the player chunk shortly before it becomes visible
  const near = useInView(ref, { once: true, margin: '480px 0px' });

  return (
    <section className="bg-surface-2/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Schneller als euer Gruppenchat.
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
            Von der Idee zur fertigen Route, während die anderen noch diskutieren.
          </p>
        </Reveal>

        <Reveal className="mt-12 md:mt-16">
          <div
            ref={ref}
            role="img"
            aria-label="Animation: Eine Abendroute zeichnet sich auf einer Karte, vier Stopps erscheinen als Foto-Karten: Späti, Park, Bowling, Jazzbar. Danach erscheint das UNPLND Logo."
            className="mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-(--radius-sheet) shadow-warm-xl ring-1 ring-line"
          >
            {near ? (
              <Suspense fallback={<PlayerSkeleton />}>
                <ShowcasePlayer reducedMotion={reduce} />
              </Suspense>
            ) : (
              <PlayerSkeleton />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlayerSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-surface" aria-hidden>
      <div className="flex h-full flex-col justify-between p-8">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-line" />
          <div className="h-6 w-48 rounded-full bg-line" />
        </div>
        <div className="h-40 rounded-3xl bg-line/60" />
      </div>
    </div>
  );
}
