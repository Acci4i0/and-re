import { animate } from 'framer-motion';
import { FOCUS } from './config.js';

/**
 * Equivalente della funzione animateVector del bundle: tre tween indipendenti
 * (x, y, z) sulla stessa durata/ease, con offset opzionale applicato solo
 * alla z di arrivo. Usata per camera.position e controls.target nel focus.
 */
export function animateVector(vector, to, duration, zOffset = 0, ease = FOCUS.ease) {
  animate(vector.x, to.x, { duration, ease, onUpdate: (v) => { vector.x = v; } });
  animate(vector.y, to.y, { duration, ease, onUpdate: (v) => { vector.y = v; } });
  animate(vector.z, to.z + zOffset, { duration, ease, onUpdate: (v) => { vector.z = v; } });
}
