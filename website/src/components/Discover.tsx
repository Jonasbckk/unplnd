import {
  BeerBottleIcon,
  BowlingBallIcon,
  BrandyIcon,
  ClockIcon,
  MapPinIcon,
  MusicNotesIcon,
} from '@phosphor-icons/react';
import { Reveal } from './ui/Reveal';

/*
 * Community preview — sample plans (mock content shown as product preview).
 * Photos: seeded placeholders, faces: pravatar stock portraits.
 */

const FEATURED_STOPS = [
  {
    time: '18:00',
    title: 'Getränke holen am Späti',
    note: 'Kaltes für den Park, jeder 5 €',
    seed: 'unplnd-spaeti-drinks',
    icon: BeerBottleIcon,
  },
  {
    time: '18:45',
    title: 'Park: Sonne, Musik, Leute',
    note: 'Box an, Decke raus, ankommen',
    seed: 'unplnd-park-golden-hour',
    icon: MusicNotesIcon,
  },
  {
    time: '21:00',
    title: 'Bowling um die Ecke',
    note: 'Zwei Bahnen, Verlierer zahlt Pommes',
    seed: 'unplnd-bowling-alley',
    icon: BowlingBallIcon,
  },
  {
    time: '23:00',
    title: 'Jazzbar zum Runterkommen',
    note: 'Livemusik bis spät',
    seed: 'unplnd-jazz-bar-night',
    icon: BrandyIcon,
  },
] as const;

export function Discover() {
  return (
    <section id="community" className="bg-surface-2/60 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Sieh, was andere planen.
          </h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
            Pläne wie diese teilt die Community: speichern, nachlaufen, besser machen.
          </p>
        </Reveal>

        <div className="mt-12 md:mt-14">
          {/* featured plan — a full evening, stop by stop */}
          <Reveal className="mx-auto max-w-2xl">
            <article className="h-full rounded-(--radius-sheet) border border-line bg-surface p-6 shadow-warm md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-heading">
                    Der Klassiker: Späti bis Jazz
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-[13.5px] font-medium text-ink-2">
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon size={15} weight="duotone" aria-hidden />4 Stopps
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon size={15} weight="duotone" aria-hidden />5 Std
                    </span>
                    <span>€</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <img
                    src="https://i.pravatar.cc/80?img=59"
                    alt=""
                    loading="lazy"
                    width={80}
                    height={80}
                    className="h-9 w-9 rounded-full border-2 border-surface object-cover shadow-warm-sm"
                  />
                  <span className="text-[13px] font-medium text-ink-2">von Sam</span>
                </div>
              </div>

              <ol className="mt-7 space-y-0">
                {FEATURED_STOPS.map((s, i) => (
                  <li key={s.time} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* connecting line */}
                    {i < FEATURED_STOPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[26px] top-14 h-[calc(100%-3.25rem)] w-1 rounded-full bg-[linear-gradient(180deg,#FF6B5A,#F2B84B)] opacity-30"
                      />
                    )}
                    <img
                      src={`https://picsum.photos/seed/${s.seed}/112/112`}
                      alt=""
                      loading="lazy"
                      width={112}
                      height={112}
                      className="h-[52px] w-[52px] shrink-0 rounded-2xl border-[3px] border-surface object-cover shadow-warm"
                    />
                    <div className="min-w-0 pt-0.5">
                      <p className="flex items-center gap-2 text-[13px] font-semibold text-terra-ink">
                        {s.time}
                        <s.icon size={15} weight="duotone" aria-hidden />
                      </p>
                      <p className="mt-0.5 truncate text-[16.5px] font-semibold tracking-tight text-heading">
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-[13.5px] text-ink-2">{s.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
