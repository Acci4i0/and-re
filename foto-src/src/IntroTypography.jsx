import { AnimatePresence, motion } from 'framer-motion';
import { INTRO } from './config.js';

const TITLE = 'ANDREA';

/**
 * Tipografia dell'intro: il titolo enorme centrato che cresce lettera per
 * lettera (animazione CSS `intro-letter-grow` in index.html) dentro un
 * fade-in del contenitore. Al termine dell'animazione dell'ultima lettera
 * parte lo slideshow (onTypographyComplete). Quando lo slideshow è avviato
 * (isIntroUnderway) il blocco esce con un fade e non torna più. Il logo in
 * alto e il sottotitolo del riferimento sono eliminati di proposito.
 */
export default function IntroTypography({ isIntroUnderway, onTypographyComplete }) {
  const { typography, letter } = INTRO;

  return (
    <AnimatePresence>
      {isIntroUnderway ? null : (
        <motion.div
          initial={{ x: '-50%', y: '-50%', opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              delay: typography.fadeInDelay,
              duration: typography.fadeInDuration,
              ease: typography.ease,
            },
          }}
          exit={{
            opacity: 0,
            transition: {
              delay: typography.fadeOutDelay,
              duration: typography.fadeOutDuration,
              ease: typography.ease,
            },
          }}
          style={{
            display: 'flex',
            position: 'fixed',
            width: 'fit-content',
            top: '50%',
            left: '50%',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            color: '#ffffff',
          }}
        >
          <p
            style={{
              display: 'flex',
              width: '100%',
              padding: '0 10px',
              gap: INTRO.titleLetterGapPx,
              margin: 0,
            }}
          >
            {TITLE.split('').map((char, index) => (
              <span
                key={`letter-${index}`}
                className="intro-letter"
                style={{
                  animationDelay: `${letter.delayBaseMs + index * letter.staggerMs}ms`,
                  // Sovrascrive la durata della shorthand in index.html: la
                  // fonte e' INTRO.letter.durationMs, che decide anche quando
                  // parte lo slideshow (animationend dell'ultima lettera).
                  animationDuration: `${letter.durationMs}ms`,
                }}
                onAnimationEnd={index === TITLE.length - 1 ? onTypographyComplete : undefined}
              >
                {char}
              </span>
            ))}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
