import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CURSOR_ICON, PORTFOLIO_ENABLED } from './config.js';

function CloseGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none">
      <path
        stroke="currentColor"
        d="M12.685 1.077.703 13.059M.704.862l11.982 11.982"
      />
    </svg>
  );
}

/**
 * Cursore custom in focus (desktop): il cursore nativo sparisce; fuori dalla
 * foto segue il mouse un box 35x35 con la x, sopra la foto la pill 202x40
 * "enter portfolio". Colori dal frame attivo (highlight/background).
 */
export default function CursorIcon({
  mouseX,
  mouseY,
  activeItem,
  activeColors,
  hoveringActive,
  isTransitioning,
}) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  // Seconda guardia: anche se hoveringActive arrivasse true, senza portfolio
  // la pill non si mostra.
  const mostraPill = hoveringActive && PORTFOLIO_ENABLED;

  const highlight = activeColors ? activeColors.highlightColor : '#000000';
  const background = activeColors ? activeColors.backgroundColor : '#ffffff';

  // Offset dal puntatore: centro del box (17.5, 17.5) / della pill (101, 20).
  const x = mouseX - (mostraPill ? CURSOR_ICON.pillWidth / 2 : CURSOR_ICON.closeSize / 2);
  const y = mouseY - (mostraPill ? CURSOR_ICON.pillHeight / 2 : CURSOR_ICON.closeSize / 2);

  return (
    <AnimatePresence>
      {activeItem && !isTransitioning ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: pressed ? CURSOR_ICON.pressedScale : 1,
            transition: { duration: CURSOR_ICON.duration, ease: CURSOR_ICON.ease },
          }}
          exit={{
            opacity: 0,
            transition: { duration: CURSOR_ICON.duration, ease: CURSOR_ICON.ease },
          }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }}
        >
          {mostraPill ? (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                width: CURSOR_ICON.pillWidth,
                height: CURSOR_ICON.pillHeight,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: background,
                border: `1px solid ${highlight}`,
                color: highlight,
                fontSize: 14,
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              enter portfolio
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                width: CURSOR_ICON.closeSize,
                height: CURSOR_ICON.closeSize,
                justifyContent: 'center',
                alignItems: 'center',
                border: `1px solid ${highlight}`,
                color: highlight,
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <CloseGlyph />
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
