import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChatCircleDotsIcon,
  ForkKnifeIcon,
  MartiniIcon,
  SparkleIcon,
} from '@phosphor-icons/react';

/**
 * Live mini render of the app's planner conversation → route card.
 * Colors/radii mirror the real app tokens (Terracotta CTA, Warm White
 * cards, radius 18/28). Pure preview: decorative, non-interactive.
 */
export function MiniPlanner() {
  const reduce = useReducedMotion();

  const enter = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.4 },
    transition: {
      duration: 0.55,
      delay: 0.25 + i * 0.28,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <div className="flex h-full flex-col gap-2.5 px-3.5 pb-4 pt-12 text-left">
      {/* header */}
      <motion.div {...enter(0)} className="mb-1 flex items-center gap-2">
        <img src="/brand/logo-mark.png" alt="" className="h-6 w-6" />
        <div>
          <p className="text-[13px] font-semibold leading-tight text-heading">Heute Abend</p>
          <p className="text-[10px] leading-tight text-ink-2">Ihr seid zu viert</p>
        </div>
      </motion.div>

      {/* app bubble */}
      <motion.div
        {...enter(1)}
        className="max-w-[85%] rounded-[18px] rounded-bl-md bg-surface px-3 py-2.5 shadow-warm-sm"
      >
        <p className="text-[12.5px] leading-snug text-ink">
          Worauf habt ihr heute Bock?
        </p>
      </motion.div>

      {/* chip answers */}
      <motion.div {...enter(2)} className="flex flex-wrap justify-end gap-1.5">
        {['Entspannt', 'Fancy', 'Überrascht uns'].map((c, i) => (
          <span
            key={c}
            className={
              i === 2
                ? 'rounded-full bg-terra px-3 py-1.5 text-[11.5px] font-semibold text-white'
                : 'rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] font-medium text-ink-2'
            }
          >
            {c}
          </span>
        ))}
      </motion.div>

      {/* app bubble 2 */}
      <motion.div
        {...enter(3)}
        className="max-w-[85%] rounded-[18px] rounded-bl-md bg-surface px-3 py-2.5 shadow-warm-sm"
      >
        <p className="text-[12.5px] leading-snug text-ink">
          Sehr gut. Eure Route steht:
        </p>
      </motion.div>

      {/* route card */}
      <motion.div
        {...enter(4)}
        className="mt-0.5 rounded-[22px] bg-surface p-3.5 shadow-warm"
      >
        <div className="flex flex-col gap-3">
          <Stop
            icon={<MartiniIcon size={13} weight="fill" />}
            time="19:30"
            title="Aperitivo · Bar Nolde"
            tone="bg-terra"
            line
          />
          <Stop
            icon={<ForkKnifeIcon size={13} weight="fill" />}
            time="20:45"
            title="Ramen · Kiosuke"
            tone="bg-sunset"
            line
          />
          <Stop
            icon={<SparkleIcon size={13} weight="fill" />}
            time="22:30"
            title="Rooftop · Überraschung"
            tone="bg-honey"
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <p className="text-[10.5px] font-medium text-ink-2">4 Std · 1,2 km zu Fuß</p>
          <span className="rounded-full bg-terra px-3 py-1.5 text-[11px] font-semibold text-white">
            Los geht's
          </span>
        </div>
      </motion.div>

      {/* incoming hint bubble */}
      <motion.div {...enter(5)} className="mt-auto flex items-center gap-1.5 self-center">
        <ChatCircleDotsIcon size={13} className="text-ink-2" weight="duotone" />
        <p className="text-[10.5px] text-ink-2">Mia und Alex sind dabei</p>
      </motion.div>
    </div>
  );
}

function Stop({
  icon,
  time,
  title,
  tone,
  line = false,
}: {
  icon: ReactNode;
  time: string;
  title: string;
  tone: string;
  line?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-2.5">
      {line && (
        <span className="absolute left-[13px] top-7 h-4 w-px bg-line" aria-hidden />
      )}
      <span
        className={`flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-white ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">{title}</p>
        <p className="text-[10.5px] leading-tight text-ink-2">{time}</p>
      </div>
    </div>
  );
}
