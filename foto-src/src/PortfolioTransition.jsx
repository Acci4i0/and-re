import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { PORTFOLIO_TRANSITION } from './config.js';

/**
 * Secondo click sul frame attivo: tutte le mesh della scena si dissolvono
 * (1 s linear), poi il riferimento naviga alla pagina dell'artista. La
 * navigazione è esclusa dallo scope: la scena resta sul fondo colorato.
 */
export default function PortfolioTransition({ isTransitioning }) {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    if (!isTransitioning) return;
    document.body.style.cursor = 'auto';
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const material = object.material;
      material.transparent = true;
      animate(material.opacity, 0, {
        duration: PORTFOLIO_TRANSITION.duration,
        ease: PORTFOLIO_TRANSITION.ease,
        onUpdate: (v) => {
          material.opacity = v;
        },
      });
    });
  }, [isTransitioning, scene]);

  return null;
}
