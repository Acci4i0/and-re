/**
 * Colore di sfondo del focus estratto dall'immagine (TASK richiesto).
 *
 * DIVERGENZA DICHIARATA dal riferimento: foam.org NON estrae il colore
 * dall'immagine — usa il frameBackgroundColor editoriale del CMS (verificato
 * nel bundle e dal vivo: la foto in bianco e nero di Nagaoka apre su teal
 * #024442, colore impossibile da derivare da un'immagine b/n). Con fotografie
 * personali non esiste un colore curato a mano, quindi qui si estrae il
 * colore medio dei pixel — l'equivalente automatico della scelta editoriale —
 * e si deriva l'highlight (caption, x, pill) per contrasto: bianco su fondi
 * scuri, quasi nero su fondi chiari, la stessa coppia usata dal CMS di foam.
 * I colori CMS in gallery-data.js restano come fallback finché la texture
 * non è pronta.
 */

const cache = new Map();
const SAMPLE_SIZE = 32;
const DARK_LUMINANCE_THRESHOLD = 0.45;

/**
 * `source` è un HTMLImageElement o un HTMLVideoElement (drawImage accetta
 * entrambi). Restituisce null se il media non ha ancora pixel da campionare:
 * il chiamante in quel caso lascia i colori CMS di fallback.
 */
export function extractImageColors(source, src) {
  if (cache.has(src)) return cache.get(src);
  if (!hasPixels(source)) return null;

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  let r = 0;
  let g = 0;
  let b = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  r = Math.round(r / pixelCount);
  g = Math.round(g / pixelCount);
  b = Math.round(b / pixelCount);

  const toHex = (v) => v.toString(16).padStart(2, '0');
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const colors = {
    backgroundColor: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
    highlightColor: luminance < DARK_LUMINANCE_THRESHOLD ? '#ffffff' : '#1a1a1a',
  };
  cache.set(src, colors);
  return colors;
}

// Un <video> espone videoWidth solo da HAVE_CURRENT_DATA in poi; un'immagine
// non ancora decodificata ha naturalWidth a 0.
function hasPixels(source) {
  return Boolean(source && (source.videoWidth || source.naturalWidth || source.width));
}
