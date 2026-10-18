import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { CAMERA_POSITION, CAMERA_POSITION_MOBILE, ORBIT, FOCUS } from './config.js';
import { animateVector } from './animate-vector.js';
import { restPosition } from './rest-position.js';

/**
 * Navigazione orbitale + volo della camera in focus/unfocus.
 *
 * La nuvola non si muove mai: al click la camera vola sul frame (target
 * compreso), al rilascio torna alla posizione salvata. Rotate/zoom/pan e
 * auto-rotate sono sospesi finché un frame è attivo.
 */
export default function Controls({ activeItem, canAutoRotate, isIntroComplete, isMobile }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const savedCameraPosition = useRef(null);

  useEffect(() => {
    if (!controls) return;

    if (activeItem) {
      savedCameraPosition.current = camera.position.clone();

      const rest = restPosition(activeItem);
      const factor = isMobile ? FOCUS.approachFactorTouch : FOCUS.approachFactor;
      const dominantDimension =
        activeItem.height > activeItem.width ? activeItem.height : activeItem.width;
      const approach = dominantDimension * factor;
      const azimuth = controls.getAzimuthalAngle();
      const behind =
        azimuth > FOCUS.behindAzimuthThreshold || azimuth < -FOCUS.behindAzimuthThreshold;

      animateVector(camera.position, rest, FOCUS.duration, behind ? -approach : approach);
      animateVector(controls.target, rest, FOCUS.duration);
    } else if (savedCameraPosition.current) {
      animateVector(camera.position, savedCameraPosition.current, FOCUS.duration);
      animateVector(controls.target, FOCUS.releaseTarget, FOCUS.duration);
    }
  }, [activeItem, controls, camera, isMobile]);

  /* Rotazione del telefono: isMobile cambia e la distanza giusta cambia con
     lui. Si riposiziona solo se non c'e' un frame a fuoco, per non strappare
     via la camera nel mezzo di un volo. Lo zoom eventualmente fatto
     dall'utente viene riportato alla distanza di partenza: su un cambio di
     orientamento e' quello che ci si aspetta. */
  useEffect(() => {
    if (!controls || activeItem) return;
    const [, , z] = isMobile ? CAMERA_POSITION_MOBILE : CAMERA_POSITION;
    if (camera.position.z === z) return;
    camera.position.set(0, 0, z);
    controls.update();
  }, [isMobile, controls, camera, activeItem]);

  // Gate dell'intro come nel riferimento: i controls si abilitano quando
  // parte l'auto-rotate (avvio dello shrink), rotate/zoom/pan quando l'intro
  // è completata. Da lì in poi il comportamento è quello preesistente.
  //
  // Il target iniziale dell'orbita è il release-target (0,0,-10), non
  // (0,0,0): il frame primario riposa esattamente a (0,0,0) e con l'orbita
  // centrata lì resterebbe inchiodato al centro dello schermo finché un
  // focus/unfocus non sposta il target (il quirk del release-target del
  // riferimento). Partendo già dal target post-release la nuvola deriva
  // subito tutta insieme, primario compreso. La direzione di vista iniziale
  // non cambia (camera e target restano sull'asse z).
  return (
    <OrbitControls
      makeDefault
      target={[FOCUS.releaseTarget.x, FOCUS.releaseTarget.y, FOCUS.releaseTarget.z]}
      enabled={canAutoRotate}
      enablePan={isIntroComplete && !activeItem}
      enableZoom={isIntroComplete && !activeItem}
      enableRotate={isIntroComplete && !activeItem}
      zoomSpeed={ORBIT.zoomSpeed}
      maxDistance={isMobile ? ORBIT.maxDistanceMobile : ORBIT.maxDistance}
      minPolarAngle={ORBIT.minPolarAngle}
      maxPolarAngle={ORBIT.maxPolarAngle}
      enableDamping
      autoRotate={canAutoRotate && !activeItem}
      autoRotateSpeed={ORBIT.autoRotateSpeed}
    />
  );
}
