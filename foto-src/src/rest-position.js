import { REST_Z_OFFSET } from './config.js';

/**
 * Posizione di riposo di un frame nella nuvola: il primario sta a (0,0,0),
 * gli altri alla posizione CMS con z + 2 (arrivo dell'animazione di entrata
 * dell'originale; l'entrata stessa appartiene all'intro, fuori scope).
 */
export function restPosition(item) {
  if (item.isPrimary) return { x: 0, y: 0, z: 0 };
  const { x, y, z } = item.position;
  return { x, y, z: z + REST_Z_OFFSET };
}
