import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import * as THREE from 'three';
import GALLERY, { INTRO_SLIDES } from '../gallery-data.js';
import {
  AMBIENT_LIGHT_INTENSITY,
  BACKGROUND,
  CAMERA_POSITION,
  CAMERA_POSITION_MOBILE,
  INTRO,
  MOBILE_MEDIA_QUERY,
} from './config.js';
import { useMediaQuery } from './use-media-query.js';
import Controls from './Controls.jsx';
import Frame from './Frame.jsx';
import PrimaryFrame from './PrimaryFrame.jsx';
import PortfolioTransition from './PortfolioTransition.jsx';
import IntroTypography from './IntroTypography.jsx';
import CursorIcon from './CursorIcon.jsx';
import Detail from './Detail.jsx';

// Precarica le texture (nuvola + slide dell'intro) durante la fase
// tipografica, come i <link rel="preload"> del riferimento: quando parte lo
// slideshow è già tutto in cache e niente sospende. I video sono esclusi:
// TextureLoader carica solo immagini, e il loro streaming lo gestisce
// l'elemento <video> (vedi use-video-texture.js).
useLoader.preload(THREE.TextureLoader, [
  ...GALLERY.filter((item) => item.type !== 'video').map((item) => item.src),
  ...INTRO_SLIDES,
]);

/**
 * Pagina della nuvola. Struttura come il riferimento: canvas WebGL trasparente
 * (react-three-fiber, prop `flat`) sopra un div il cui background-color viene
 * animato; cursore custom, caption e tipografia dell'intro in DOM.
 *
 * Intro (riparte a ogni refresh, è lo stato iniziale):
 *   nero + tipografia -> playIntro (slideshow del primario, frame montati) ->
 *   isIntroUnderway (tipografia esce, sfondo bianco) -> canAutoRotate
 *   (controlli attivi, drift) -> isIntroComplete (hover/click abilitati,
 *   cursore grab). Da lì in poi la navigazione è quella preesistente.
 */
export default function App() {
  const [playIntro, setPlayIntro] = useState(false);
  const [isIntroUnderway, setIsIntroUnderway] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [canAutoRotate, setCanAutoRotate] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [hoveringActive, setHoveringActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [background, setBackground] = useState(INTRO.initialBackground);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [imageColors, setImageColors] = useState({});
  const containerRef = useRef(null);
  const mouseIsDown = useRef(false);

  // Gate mobile come il riferimento: solo larghezza (max-width 768px),
  // reattivo al resize/rotazione.
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

  // Il cursore custom in focus segue il mouse tracciato sul container
  // (nel riferimento: useGesture onMove sul wrapper della pagina).
  useGesture(
    { onMove: ({ xy }) => setMouse({ x: xy[0], y: xy[1] }) },
    { target: containerRef },
  );

  // Colori del frame attivo: estratti dall'immagine quando disponibili
  // (vedi extract-image-colors.js), CMS come fallback.
  const activeColors = activeItem
    ? (imageColors[activeItem.id] ?? {
        backgroundColor: activeItem.backgroundColor,
        highlightColor: activeItem.highlightColor,
      })
    : null;

  // Sfondo: nero durante l'intro, bianco da quando lo slideshow è avviato,
  // colore del frame attivo in focus (sempre 0.2 s linear).
  const backgroundRef = useRef(INTRO.initialBackground);
  useEffect(() => {
    const target = activeColors
      ? activeColors.backgroundColor
      : isIntroUnderway
        ? BACKGROUND.defaultColor
        : INTRO.initialBackground;
    if (target === backgroundRef.current) return;
    animate(backgroundRef.current, target, {
      duration: BACKGROUND.duration,
      ease: BACKGROUND.ease,
      onUpdate: (v) => {
        backgroundRef.current = v;
        setBackground(v);
      },
    });
  }, [activeItem, imageColors, isIntroUnderway]);

  // Cursore della nuvola: compare a intro completata, come nel riferimento.
  useEffect(() => {
    if (isIntroComplete) document.body.style.cursor = 'grab';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isIntroComplete]);

  const handleActivate = useCallback((item) => setActiveItem(item), []);
  const handleImageColors = useCallback((id, colors) => {
    setImageColors((prev) => (prev[id] ? prev : { ...prev, [id]: colors }));
  }, []);
  const handleDeactivate = useCallback(() => {
    setActiveItem(null);
    setHoveringActive(false);
  }, []);
  const handlePortfolioTransition = useCallback(() => setIsTransitioning(true), []);
  const handleTypographyComplete = useCallback(() => setPlayIntro(true), []);
  const handleIntroUnderway = useCallback(() => setIsIntroUnderway(true), []);
  const handleCanAutoRotate = useCallback(() => setCanAutoRotate(true), []);
  const handleIntroComplete = useCallback(() => setIsIntroComplete(true), []);

  const frameProps = {
    activeItem,
    isIntroComplete,
    isMobile,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    onHoverActiveChange: setHoveringActive,
    onPortfolioTransition: handlePortfolioTransition,
    onImageColors: handleImageColors,
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100svh', overflow: 'hidden', backgroundColor: background }}
      onMouseDown={() => {
        mouseIsDown.current = true;
      }}
      onMouseMove={() => {
        if (mouseIsDown.current && isIntroComplete) document.body.style.cursor = 'grabbing';
      }}
      onMouseUp={() => {
        mouseIsDown.current = false;
        if (isIntroComplete) document.body.style.cursor = 'grab';
      }}
    >
      {/* useMediaQuery si inizializza in modo sincrono, quindi isMobile e' gia'
          giusto al primo render e la camera nasce alla distanza corretta senza
          rimontare il Canvas. */}
      <Canvas flat camera={{ position: isMobile ? CAMERA_POSITION_MOBILE : CAMERA_POSITION }}>
        <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
        <Controls
          activeItem={activeItem}
          canAutoRotate={canAutoRotate}
          isIntroComplete={isIntroComplete}
          isMobile={isMobile}
        />
        <PortfolioTransition isTransitioning={isTransitioning} />
        <Suspense fallback={null}>
          <group>
            {playIntro &&
              GALLERY.map((item) =>
                item.isPrimary ? (
                  <PrimaryFrame
                    key={item.id}
                    item={item}
                    playIntro={playIntro}
                    onIntroUnderway={handleIntroUnderway}
                    onCanAutoRotate={handleCanAutoRotate}
                    onIntroComplete={handleIntroComplete}
                    {...frameProps}
                  />
                ) : (
                  <Frame key={item.id} item={item} {...frameProps} />
                ),
              )}
          </group>
        </Suspense>
      </Canvas>
      <IntroTypography
        isIntroUnderway={isIntroUnderway}
        onTypographyComplete={handleTypographyComplete}
      />
      {!isMobile && (
        <CursorIcon
          mouseX={mouse.x}
          mouseY={mouse.y}
          activeItem={activeItem}
          activeColors={activeColors}
          hoveringActive={hoveringActive}
          isTransitioning={isTransitioning}
        />
      )}
      <Detail
        activeItem={activeItem}
        activeColors={activeColors}
        isTransitioning={isTransitioning}
        isMobile={isMobile}
        onPortfolioTransition={handlePortfolioTransition}
      />
    </div>
  );
}
