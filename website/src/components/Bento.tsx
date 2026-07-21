import type { ReactNode } from 'react';
import {
  CompassIcon,
  CoinsIcon,
  ImagesSquareIcon,
  NavigationArrowIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { Reveal } from './ui/Reveal';
import { PinImage } from './ui/PinImage';

/**
 * 5 cells, exactly 5 features — row 1: 4+2, row 2: 2+2+2.
 * Visual diversity: live mini-UI (A), real photos (B), gradient+mascot (E).
 */
export function Bento() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <Reveal className="max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          Alles drin für echte Abende.
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
          Planen, loslaufen, erinnern und Leute finden, die eure Abende teilen.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-6 md:gap-5">
        {/* A — route & navigation, with a live mini route UI */}
        <Reveal className="md:col-span-4">
          <Cell className="flex h-full flex-col justify-between gap-8">
            <div>
              <CellIcon tone="bg-coral">
                <NavigationArrowIcon size={24} weight="fill" />
              </CellIcon>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-heading">
                Eine Route statt zehn Tabs
              </h3>
              <p className="mt-2 max-w-[42ch] text-[15.5px] leading-relaxed text-ink-2">
                Spots, Zeiten und Wege greifen ineinander. Die Navigation bringt euch von Tür
                zu Tür.
              </p>
            </div>
            {/* mini route strip (decorative product preview) */}
            <div aria-hidden className="rounded-3xl bg-bg p-4 shadow-warm-sm">
              <div className="flex items-center">
                {[
                  { label: 'Bar', seed: 'unplnd-aperitivo-bar' },
                  { label: 'Essen', seed: 'unplnd-ramen-shop' },
                  { label: 'Rooftop', seed: 'unplnd-rooftop-lights' },
                ].map((s, i) => (
                  <div key={s.label} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
                    {i > 0 && (
                      <span className="mx-2 h-1 flex-1 rounded-full bg-[linear-gradient(90deg,#FF6B5A,#F2B84B)] opacity-60" />
                    )}
                    <span className="flex flex-col items-center gap-1.5">
                      <img
                        src={`https://picsum.photos/seed/${s.seed}/88/88`}
                        alt=""
                        loading="lazy"
                        width={88}
                        height={88}
                        className="h-11 w-11 rounded-full border-[3px] border-surface object-cover shadow-warm"
                      />
                      <span className="text-[11px] font-medium text-ink-2">{s.label}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-line pt-2.5 text-center text-[12px] font-medium text-ink-2">
                Nächster Stopp in 400 m
              </p>
            </div>
          </Cell>
        </Reveal>

        {/* B — memory albums with real photos */}
        <Reveal index={1} className="md:col-span-2">
          <Cell className="flex h-full flex-col">
            <CellIcon tone="bg-sunset">
              <ImagesSquareIcon size={24} weight="fill" />
            </CellIcon>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-heading">
              Alben, die sich selbst bauen
            </h3>
            <div className="relative mx-auto mt-6 h-40 w-44">
              <img
                src="https://picsum.photos/seed/unplnd-citynight/240/300"
                alt="Stadtlichter am Abend"
                loading="lazy"
                className="absolute left-0 top-4 w-22 -rotate-8 rounded-xl border-4 border-surface shadow-warm"
              />
              <img
                src="https://picsum.photos/seed/unplnd-confetti/240/300"
                alt="Konfetti auf der Tanzfläche"
                loading="lazy"
                className="absolute left-1/2 top-0 w-22 -translate-x-1/2 rotate-2 rounded-xl border-4 border-surface shadow-warm-lg"
              />
              <img
                src="https://picsum.photos/seed/unplnd-dinner/240/300"
                alt="Abendessen mit Freunden"
                loading="lazy"
                className="absolute right-0 top-5 w-22 rotate-8 rounded-xl border-4 border-surface shadow-warm"
              />
            </div>
            <p className="mt-5 text-[14.5px] leading-relaxed text-ink-2">
              Alle Fotos vom Abend, von allen. Automatisch sortiert.
            </p>
          </Cell>
        </Reveal>

        {/* C — friends & community */}
        <Reveal className="md:col-span-2">
          <Cell>
            <CellIcon tone="bg-ocean">
              <UsersThreeIcon size={24} weight="fill" />
            </CellIcon>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-heading">
              Freunde finden
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
              Folgt einander, teilt Pläne und quatscht über Bars, Clubs und Geheimtipps.
            </p>
            <div aria-hidden className="mt-5">
              <div className="flex -space-x-2.5">
                {[33, 12, 47, 5].map((id) => (
                  <img
                    key={id}
                    src={`https://i.pravatar.cc/72?img=${id}`}
                    alt=""
                    loading="lazy"
                    width={72}
                    height={72}
                    className="h-9 w-9 rounded-full border-2 border-surface object-cover"
                  />
                ))}
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-beige text-[12px] font-semibold text-heading">
                  +9
                </span>
              </div>
              <p className="mt-3 inline-block max-w-full rounded-[14px] rounded-bl-md bg-bg px-3 py-1.5 text-[12px] text-ink shadow-warm-sm">
                Freitag wieder? Bin dabei.
              </p>
            </div>
          </Cell>
        </Reveal>

        {/* D — budget */}
        <Reveal index={1} className="md:col-span-2">
          <Cell>
            <CellIcon tone="bg-olive">
              <CoinsIcon size={24} weight="fill" />
            </CellIcon>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-heading">
              Passt in euer Budget
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
              Sagt, was drin ist. Jeder Vorschlag bleibt ehrlich im Rahmen.
            </p>
            <div aria-hidden className="mt-5 flex gap-2">
              {['€', '€€', '€€€'].map((b, i) => (
                <span
                  key={b}
                  className={
                    i === 1
                      ? 'rounded-full bg-terra px-4 py-1.5 text-[13px] font-semibold text-white'
                      : 'rounded-full border border-line bg-bg px-4 py-1.5 text-[13px] font-medium text-ink-2'
                  }
                >
                  {b}
                </span>
              ))}
            </div>
          </Cell>
        </Reveal>

        {/* E — brand cell with Pin on the logo gradient */}
        <Reveal index={2} className="md:col-span-2">
          <div className="relative h-full min-h-52 overflow-hidden rounded-(--radius-card) bg-[linear-gradient(140deg,#FF6B5A_0%,#E88C5A_55%,#F2B84B_100%)] p-6 shadow-warm md:p-7">
            <CompassIcon size={24} weight="duotone" className="text-white/90" aria-hidden />
            <h3 className="mt-4 max-w-[12ch] text-xl font-semibold tracking-tight text-[#33241E]">
              Entdecken, was heute geht
            </h3>
            <p className="mt-2 max-w-[20ch] text-[14.5px] leading-relaxed text-[#4A362E]">
              Events und Spots in deiner Nähe, kuratiert statt endlos.
            </p>
            <PinImage
              name="pin-chill"
              alt="Pin, das UNPLND Maskottchen, lehnt entspannt im Bild"
              className="absolute -bottom-2 -right-2 w-28 drop-shadow-lg"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Cell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`h-full rounded-(--radius-card) border border-line bg-surface p-6 shadow-warm-sm transition-shadow duration-300 hover:shadow-warm md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

function CellIcon({ children, tone = 'bg-terra' }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[#33241E] shadow-warm-sm ${tone}`}
    >
      {children}
    </span>
  );
}
