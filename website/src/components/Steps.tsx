import type { ReactNode } from 'react';
import {
  ChatCircleDotsIcon,
  ImagesSquareIcon,
  MapTrifoldIcon,
} from '@phosphor-icons/react';
import { Reveal } from './ui/Reveal';

export function Steps() {
  return (
    <section id="ablauf" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <Reveal className="max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
          So läuft dein Abend.
        </h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
          Drei Momente. Der Rest passiert draußen, nicht am Handy.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
        {/* 1 — the conversation */}
        <Reveal>
          <StepCard
            surface="bg-surface border-line"
            icon={<ChatCircleDotsIcon size={24} weight="fill" aria-hidden />}
            iconTone="bg-coral"
            title="Sagt, worauf ihr Bock habt"
            body="Stimmung, Budget, Gruppe, Zeit. Fühlt sich an wie Freunden schreiben, nicht wie ein Formular."
          >
            <div aria-hidden className="flex h-full w-full flex-col justify-center gap-2.5 px-5">
              <span className="max-w-[80%] self-start rounded-[16px] rounded-bl-md bg-surface px-3 py-2 text-[12.5px] text-ink shadow-warm-sm">
                Worauf habt ihr Bock?
              </span>
              <span className="flex justify-end gap-1.5">
                {['Chill', 'Fancy', 'Wild'].map((c, i) => (
                  <span
                    key={c}
                    className={
                      i === 2
                        ? 'rounded-full bg-terra px-3 py-1.5 text-[11.5px] font-semibold text-white shadow-warm-sm'
                        : 'rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-medium text-ink-2'
                    }
                  >
                    {c}
                  </span>
                ))}
              </span>
            </div>
          </StepCard>
        </Reveal>

        {/* 2 — the route */}
        <Reveal index={1} className="md:mt-10">
          <StepCard
            surface="bg-terra/8 border-terra/15"
            icon={<MapTrifoldIcon size={24} weight="fill" aria-hidden />}
            iconTone="bg-sunset"
            title="Folgt eurer Route"
            body="Bar, Essen, Überraschung: alles passt zusammen, mit Navigation von Spot zu Spot."
          >
            <div aria-hidden className="flex h-full w-full items-center justify-center px-6">
              <div className="flex w-full items-center">
                {[
                  { seed: 'unplnd-bar-neon', time: '19:30' },
                  { seed: 'unplnd-streetfood', time: '21:00' },
                  { seed: 'unplnd-rooftop-view', time: '23:00' },
                ].map((s, i) => (
                  <div key={s.seed} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
                    {i > 0 && (
                      <span className="mx-1.5 h-1 flex-1 rounded-full bg-[linear-gradient(90deg,#FF6B5A,#F2B84B)] opacity-60" />
                    )}
                    <span className="flex flex-col items-center gap-1">
                      <img
                        src={`https://picsum.photos/seed/${s.seed}/96/96`}
                        alt=""
                        loading="lazy"
                        width={96}
                        height={96}
                        className="h-12 w-12 rounded-full border-[3px] border-surface object-cover shadow-warm"
                      />
                      <span className="text-[10.5px] font-semibold text-ink-2">{s.time}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </StepCard>
        </Reveal>

        {/* 3 — the album */}
        <Reveal index={2} className="md:mt-20">
          <StepCard
            surface="bg-surface-2 border-line"
            icon={<ImagesSquareIcon size={24} weight="fill" aria-hidden />}
            iconTone="bg-honey"
            title="Behaltet den Abend"
            body="Eure Fotos landen automatisch in einem gemeinsamen Album. Am Morgen danach ist es einfach da."
          >
            <div aria-hidden className="relative h-full w-full">
              <img
                src="https://picsum.photos/seed/unplnd-polaroid-friends/200/240"
                alt=""
                loading="lazy"
                width={200}
                height={240}
                className="absolute left-[22%] top-4 w-20 -rotate-6 rounded-lg border-4 border-surface object-cover shadow-warm"
              />
              <img
                src="https://picsum.photos/seed/unplnd-polaroid-lights/200/240"
                alt=""
                loading="lazy"
                width={200}
                height={240}
                className="absolute right-[22%] top-2 w-20 rotate-4 rounded-lg border-4 border-surface object-cover shadow-warm-lg"
              />
            </div>
          </StepCard>
        </Reveal>
      </div>
    </section>
  );
}

function StepCard({
  surface,
  icon,
  iconTone = 'bg-terra',
  title,
  body,
  children,
}: {
  surface: string;
  icon: ReactNode;
  iconTone?: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <article
      className={`group h-full rounded-(--radius-card) border p-5 shadow-warm-sm transition-shadow duration-300 hover:shadow-warm md:p-6 ${surface}`}
    >
      {/* product vignette */}
      <div className="h-36 overflow-hidden rounded-2xl border border-line/60 bg-bg transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.015]">
        {children}
      </div>
      <span
        className={`mt-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[#33241E] shadow-warm-sm ${iconTone}`}
      >
        {icon}
      </span>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-heading">{title}</h3>
      <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{body}</p>
    </article>
  );
}
