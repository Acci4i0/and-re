import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { FRAME_FADE, PORTFOLIO_ENABLED } from './config.js';

/**
 * Comportamenti comuni a tutti i frame (primario incluso):
 *
 * - billboard: a ogni tick il gruppo copia l'orientamento della camera
 * - dissolvenza quando un altro frame è in focus, ritorno alla chiusura
 * - handler puntatore: hover (solo desktop, solo a intro completata, solo in
 *   nuvola), click per focus/transizione, pointer-missed per l'unfocus
 *
 * `cursorAfterRelease` replica una piccola incoerenza del riferimento: dopo
 * l'unfocus i frame normali rimettono il cursore "grab", il primario "auto".
 */
export function useFrameInteractions({
  item,
  activeItem,
  isIntroComplete,
  isMobile,
  onActivate,
  onDeactivate,
  onHoverActiveChange,
  onPortfolioTransition,
  cursorAfterRelease = 'grab',
}) {
  const group = useRef();
  const material = useRef();
  const [hovered, setHovered] = useState(false);
  const isActive = activeItem === item;

  useFrame(({ camera }) => {
    if (group.current) group.current.rotation.setFromRotationMatrix(camera.matrix);
  });

  useEffect(() => {
    if (!material.current) return;
    if (activeItem && !isActive) {
      animate(material.current.opacity, 0, {
        duration: FRAME_FADE.duration,
        ease: FRAME_FADE.ease,
        onUpdate: (v) => {
          if (material.current) material.current.opacity = v;
        },
      });
    } else if (!activeItem) {
      animate(material.current.opacity, 1, {
        duration: FRAME_FADE.duration,
        ease: FRAME_FADE.ease,
        onUpdate: (v) => {
          if (material.current) material.current.opacity = v;
        },
      });
    }
  }, [activeItem, isActive]);

  const handlers = {
    onClick: () => {
      if (!isIntroComplete) return;
      document.body.style.cursor = 'none';
      setHovered(false);
      if (activeItem) {
        if (isActive && !isMobile) {
          if (PORTFOLIO_ENABLED) {
            onPortfolioTransition();
          } else {
            // Senza portfolio il click sulla foto la chiude. Il cursore va
            // rimesso prima, come fa onPointerMissed: qui sopra e' stato
            // messo a 'none' per la x disegnata, e chiudendo sparirebbe
            // lasciando il puntatore invisibile.
            document.body.style.cursor = cursorAfterRelease;
            onDeactivate();
          }
        }
      } else {
        onActivate(item);
      }
    },
    onPointerMove: () => {
      if (!isIntroComplete) return;
      if (activeItem) {
        if (isActive) onHoverActiveChange(PORTFOLIO_ENABLED);
      } else {
        document.body.style.cursor = 'pointer';
      }
    },
    onPointerEnter: () => {
      if (!isIntroComplete || isMobile || activeItem) return;
      setHovered(true);
    },
    onPointerLeave: () => {
      if (activeItem) {
        if (isActive) onHoverActiveChange(false);
      } else {
        document.body.style.cursor = 'grab';
        setHovered(false);
      }
    },
    onPointerMissed: () => {
      if (!isActive) return;
      document.body.style.cursor = cursorAfterRelease;
      onDeactivate();
    },
  };

  return { group, material, hovered, handlers };
}
