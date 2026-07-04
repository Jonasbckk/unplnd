import { Suspense, lazy, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRightIcon, InstagramLogoIcon, TiktokLogoIcon } from '@phosphor-icons/react';
import { Reveal } from './ui/Reveal';

const SocialPlayer = lazy(() => import('./SocialPlayer'));

const CHANNELS = [
  {
    name: 'TikTok',
    handle: '@unplnd.com',
    href: 'https://www.tiktok.com/@unplnd.com',
    icon: TiktokLogoIcon,
    note: 'Spots, fertige Pläne, POVs aus euren Städten.',
  },
  {
    name: 'Instagram',
    handle: '@unplndcom',
    href: 'https://www.instagram.com/unplndcom/',
    icon: InstagramLogoIcon,
    note: 'Behind the scenes, Pin und alles zum Launch.',
  },
] as const;

export function Social() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '420px 0px' });

  return (
    <section id="social" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* copy + channels */}
        <div>
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
              Bekannt aus euren Feeds.
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
              UNPLND ging viral auf TikTok und Instagram. Folg uns, dann verpasst du weder
              Spots noch den Launch.
            </p>
          </Reveal>

          <div className="mt-8 flex max-w-md flex-col gap-4">
            {CHANNELS.map((c, i) => (
              <Reveal key={c.name} index={i}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable group flex items-center gap-4 rounded-(--radius-card) border border-line bg-surface p-5 shadow-warm-sm transition-shadow duration-300 hover:shadow-warm"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-terra/12">
                    <c.icon
                      size={30}
                      weight="fill"
                      className="text-heading transition-colors duration-300 group-hover:text-terra"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold tracking-tight text-heading">
                      {c.name}
                      <span className="ml-2 text-[14px] font-semibold text-terra-ink">
                        {c.handle}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-ink-2">{c.note}</span>
                  </span>
                  <ArrowUpRightIcon
                    size={20}
                    weight="bold"
                    className="shrink-0 text-ink-2 transition-[color,translate] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-terra"
                    aria-hidden
                  />
                </a>
              </Reveal>
            ))}
          </div>
        </div>

        {/* the viral feed, in a slim phone frame */}
        <Reveal className="mx-auto w-full max-w-[300px]">
          <div className="rounded-[42px] bg-[#26201c] p-2.5 shadow-warm-xl ring-1 ring-white/25">
            <div
              ref={ref}
              role="img"
              aria-label="Animation: UNPLND Kurzvideos in einem Feed. Herzen fliegen hoch, Kommentare erscheinen, der nächste Clip wischt herein."
              className="relative aspect-[1080/1500] overflow-hidden rounded-[32px] bg-[#171412]"
            >
              {/* dynamic island */}
              <div className="absolute left-1/2 top-2.5 z-10 h-[20px] w-[76px] -translate-x-1/2 rounded-full bg-[#26201c]" />
              {near ? (
                <Suspense fallback={<FeedSkeleton />}>
                  <SocialPlayer reducedMotion={reduce} />
                </Suspense>
              ) : (
                <FeedSkeleton />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col justify-end gap-3 bg-[#211d1a] p-5" aria-hidden>
      <div className="h-9 w-9 rounded-full bg-[#302a26]" />
      <div className="h-3.5 w-2/3 rounded-full bg-[#302a26]" />
      <div className="h-3 w-1/2 rounded-full bg-[#302a26]" />
    </div>
  );
}
