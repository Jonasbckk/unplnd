import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { PinImage } from './ui/PinImage';
import { PhoneMockup } from './PhoneMockup';
import { MiniPlanner } from './MiniPlanner';

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -36]);

  const item = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.08 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section
      ref={ref}
      id="top"
      className="relative overflow-x-clip pt-24 md:pt-28"
      aria-labelledby="hero-title"
    >
      {/* warm ambient glow behind the composition */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            'radial-gradient(560px 380px at 78% 30%, var(--glow), transparent 70%), radial-gradient(420px 300px at 12% 8%, rgba(201,123,99,0.10), transparent 70%)',
        }}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        {/* copy */}
        <div className="max-w-xl">
          <motion.h1
            {...item(0)}
            id="hero-title"
            className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-heading sm:text-5xl lg:text-6xl"
          >
            Nie wieder &bdquo;Was machen wir heute?&ldquo;
          </motion.h1>
          <motion.p {...item(1)} className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink-2">
            UNPLND baut euch in Sekunden die passende Abend-Route: Spots, Navigation und ein
            Album, das sich von selbst füllt. Bald für iOS und Android.
          </motion.p>
          <motion.div {...item(2)} className="mt-8">
            <a
              href="#early-access"
              className="pressable inline-flex min-h-14 items-center gap-2.5 rounded-(--radius-btn) bg-btn px-7 text-[17px] font-semibold text-btn-text shadow-warm hover:shadow-warm-lg"
            >
              Early Access sichern
              <ArrowRightIcon size={20} weight="bold" aria-hidden />
            </a>
          </motion.div>
        </div>

        {/* product */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto pb-6 lg:pb-2"
        >
          <motion.div style={{ y: phoneY }} className="relative">
            {/* Pin peeks over the top edge of the phone */}
            <PinImage
              name="pin-peek"
              alt=""
              className="absolute -top-[74px] right-8 z-10 w-28"
            />
            <PhoneMockup label="Vorschau der UNPLND App: Planer-Chat mit fertiger Abendroute">
              <MiniPlanner />
            </PhoneMockup>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
