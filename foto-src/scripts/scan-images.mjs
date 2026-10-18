import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { readVideoDimensions } from './video-dimensions.mjs';

/**
 * Due cartelle, due ruoli, entrambe fonte di verità:
 *
 *   public/img2  i 20 slot della nuvola: immagini e video, mescolati.
 *   public/dab   le immagini dell'animazione di apertura.
 *
 * Questo script gira automaticamente prima di `npm run dev` e `npm run build`
 * (pre-hook) e
 *
 * 1. normalizza in-place le immagini di entrambe le cartelle (orientamento
 *    EXIF baked, resize al tetto di MAX_WIDTH, ri-encode JPEG che rimuove i
 *    metadati, GPS incluso). Un file ricodificato viene anche rinominato in
 *    .jpg: il MIME che il server deduce dall'estensione deve corrispondere al
 *    contenuto. I video non vengono toccati: se ne legge solo la dimensione
 *    dall'header (vedi video-dimensions.mjs);
 * 2. assegna i media di img2 ai 20 slot del layout (posizioni CMS del
 *    riferimento, vedi gallery-data.js) con uno shuffle seedato dall'hash
 *    della lista file: stabile finché la cartella non cambia, si rimescola
 *    quando cambia. Con meno di 20 file ricicla ciclicamente, con più di 20
 *    ne sceglie 20;
 * 3. compone le 8 slide dell'intro: le prime 7 da dab, l'ottava è
 *    obbligatoriamente il media dello slot primario. Un file di dab chiamato
 *    "first.<ext>" apre l'animazione: è il gemello di "primary." e serve a
 *    scegliere con quale immagine si comincia, non solo con quale si finisce. Non è una scelta: nel
 *    riferimento l'ultima slide resta sul piano che si restringe e diventa
 *    il frame primario in nuvola, quindi deve essere la stessa immagine.
 *    Per lo stesso motivo lo slot primario non può essere un video, e se lo
 *    shuffle ce ne mette uno viene scambiato;
 * 4. emette src/gallery-images.generated.js con dimensioni normalizzate a
 *    larghezza NORMALIZED_WIDTH (convenzione del CMS del riferimento:
 *    mantiene identica la scala mondo e la distanza di focus) e query
 *    ?v=<hash> di cache-busting su ogni src.
 */

// fileURLToPath e non .pathname: quest'ultimo lascia le sequenze
// percent-encoded, e un percorso che contiene uno spazio non verrebbe trovato.
const GALLERY_DIR = fileURLToPath(new URL('../public/img2/', import.meta.url));
const INTRO_DIR = fileURLToPath(new URL('../public/dab/', import.meta.url));
const OUT_FILE = fileURLToPath(new URL('../src/gallery-images.generated.js', import.meta.url));
const GALLERY_URL_BASE = 'img2';
const INTRO_URL_BASE = 'dab';

// Tetto della texture. Non tocca il layout: la scala mondo resta ancorata a
// NORMALIZED_WIDTH, questo è solo quanti pixel veri contiene il file. Il
// limite utile è quanto grande viene disegnato un frame a fuoco (~1400 px
// device su uno schermo Retina 1440x900, ~2250 px su un 5K): oltre non si
// vede nulla in più e la memoria della GPU cresce col quadrato.
const MAX_WIDTH = 2600;
// Le immagini di dab sono lampi da 250 ms a schermo intero e non restano mai:
// quella che resta sul piano che si restringe arriva da img2, non da qui.
// Quindi si limita il LATO LUNGO, non la larghezza: una verticale 2600x3467 e'
// 9 MP, cioe' 34 MB di memoria GPU, e a schermo intero su un viewport
// orizzontale se ne vede meno della meta' — il resto sono pixel caricati e mai
// mostrati. A 2000 di lato lungo la stessa foto scende a 3 MP / 12 MB.
const INTRO_MAX_LONG_SIDE = 2000;
const NORMALIZED_WIDTH = 2000;
const SLOT_COUNT = 20;
const PRIMARY_SLOT_INDEX = 12;
const INTRO_SLIDE_COUNT = 8;
const JPEG_QUALITY = 90;
const IMAGE_PATTERN = /\.(jpe?g|png|webp)$/i;
const VIDEO_PATTERN = /\.(mp4|m4v|mov)$/i;
const UNSUPPORTED_VIDEO_PATTERN = /\.(webm|avi|mkv|wmv|flv|mpg|mpeg)$/i;
// libheif rifiuta gli HEIC dell'iPhone (troppi riferimenti interni) e la
// build gira su ubuntu, dove non c'è sips per convertirli.
const HEIC_PATTERN = /\.(heic|heif)$/i;
// Un file di img2 chiamato "primary.<ext>" occupa sempre lo slot primario:
// è il frame al centro della nuvola ed è anche l'ultima slide dell'intro,
// quindi è l'unico modo di scegliere con quale immagine si chiude l'apertura.
const PRIMARY_IMAGE_PATTERN = /^primary\./i;
// Simmetrico: un file di dab chiamato "first.<ext>" è la prima slide
// dell'intro. Senza, le 7 slide da dab restano nell'ordine mescolato.
const INTRO_FIRST_IMAGE_PATTERN = /^first\./i;
// I file finiscono nel repo e li serve GitHub Pages, che non è una CDN.
const LARGE_VIDEO_WARNING_BYTES = 8 * 1024 * 1024;

const galleryMedia = await collectMedia(GALLERY_DIR, 'public/img2', {
  allowVideo: true,
  cap: { mode: 'width', px: MAX_WIDTH },
});
const introImages = await collectMedia(INTRO_DIR, 'public/dab', {
  allowVideo: false,
  cap: { mode: 'longSide', px: INTRO_MAX_LONG_SIDE },
});

const galleryImages = galleryMedia.filter((item) => item.type === 'image');
const galleryVideos = galleryMedia.filter((item) => item.type === 'video');

if (galleryImages.length === 0) {
  console.error(
    'scan-images: public/img2 non può contenere solo video — lo slot primario deve essere ' +
      "un'immagine, perché è anche l'ultima slide dell'intro.",
  );
  process.exit(1);
}
if (introImages.length === 0) {
  console.error('scan-images: public/dab è vuota — servono le immagini dell\'animazione di apertura.');
  process.exit(1);
}

// --- assegnazione agli slot ---------------------------------------------------

// mulberry32: PRNG deterministico; il seed viene dall'hash dei nomi file,
// così la mappatura è stabile a cartella invariata.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const listHash = createHash('md5')
  .update([...galleryMedia, ...introImages].map((item) => item.name).join('\n'))
  .digest();
const random = mulberry32(listHash.readUInt32LE(0));

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const deck = shuffled(galleryMedia);
if (deck.length < SLOT_COUNT) {
  console.warn(`scan-images: ${deck.length} media per ${SLOT_COUNT} slot — alcuni verranno riusati.`);
} else if (deck.length > SLOT_COUNT) {
  console.warn(`scan-images: ${deck.length} media in img2 per ${SLOT_COUNT} slot — ${deck.length - SLOT_COUNT} resteranno fuori.`);
}
const slotMedia = Array.from({ length: SLOT_COUNT }, (_, i) => deck[i % deck.length]);

const pinned = galleryMedia.find((item) => PRIMARY_IMAGE_PATTERN.test(item.name));
if (pinned && pinned.type === 'video') {
  console.error(
    `scan-images: ${pinned.name} è un video, ma lo slot primario deve essere un'immagine: ` +
      "è anche l'ultima slide dell'intro.",
  );
  process.exit(1);
}
if (pinned) {
  // Scambia, così il media che occupava il primario non sparisce dalla nuvola.
  const previousIndex = slotMedia.indexOf(pinned);
  const displaced = slotMedia[PRIMARY_SLOT_INDEX];
  slotMedia[PRIMARY_SLOT_INDEX] = pinned;
  if (previousIndex >= 0 && previousIndex !== PRIMARY_SLOT_INDEX) slotMedia[previousIndex] = displaced;
  console.log(`scan-images: ${pinned.name} fissata allo slot primario e come ultima slide dell'intro.`);
}

if (slotMedia[PRIMARY_SLOT_INDEX].type === 'video') {
  const swapIndex = slotMedia.findIndex((item) => item.type === 'image');
  [slotMedia[PRIMARY_SLOT_INDEX], slotMedia[swapIndex]] = [
    slotMedia[swapIndex],
    slotMedia[PRIMARY_SLOT_INDEX],
  ];
  console.log(
    `scan-images: slot primario scambiato con lo slot ${swapIndex + 1} — nell'intro non vanno video.`,
  );
}

// --- slide dell'intro: 7 da dab, l'ottava è il primario -----------------------

const primaryMedia = slotMedia[PRIMARY_SLOT_INDEX];
const introPool = shuffled(introImages);
const wantedFromIntroDir = INTRO_SLIDE_COUNT - 1;
if (introPool.length < wantedFromIntroDir) {
  console.warn(
    `scan-images: public/dab ha ${introPool.length} immagini per ${wantedFromIntroDir} slide ` +
      `— ${wantedFromIntroDir - introPool.length} verranno ripetute. Aggiungine altre per averle tutte diverse.`,
  );
}
// Se c'è una "first.", va in testa. Le altre slide ciclano sul resto del
// mazzo e non su tutto: quando dab ha meno immagini degli slot, a ripetersi
// non deve essere proprio quella di apertura.
const pinnedFirst = introPool.find((item) => INTRO_FIRST_IMAGE_PATTERN.test(item.name));
const rotation = pinnedFirst ? introPool.filter((item) => item !== pinnedFirst) : introPool;
if (pinnedFirst) {
  console.log(`scan-images: ${pinnedFirst.name} fissata come prima slide dell'intro.`);
}

const introSlides = Array.from({ length: wantedFromIntroDir }, (_, i) => {
  if (pinnedFirst && i === 0) return { item: pinnedFirst, base: INTRO_URL_BASE };
  const pool = pinnedFirst ? rotation : introPool;
  const index = pinnedFirst ? i - 1 : i;
  return { item: pool[index % pool.length], base: INTRO_URL_BASE };
});
introSlides.push({ item: primaryMedia, base: GALLERY_URL_BASE });

// --- emissione del modulo generato -------------------------------------------

const srcOf = ({ item, base }) => `${base}/${item.name}?v=${item.version}`;
const normalizedHeight = (item) => Math.round((item.height * NORMALIZED_WIDTH) / item.width);

const module_ = `// GENERATO da scripts/scan-images.mjs — non modificare a mano.
// Rigenerato automaticamente prima di ogni dev/build da public/img2 (nuvola)
// e public/dab (intro). Dimensioni normalizzate a larghezza ${NORMALIZED_WIDTH}
// (convenzione del riferimento); ?v= è cache-busting sul contenuto del file.
// INTRO_SLIDES contiene solo immagini: nell'intro non compaiono mai video.
// L'ultima slide è il media dello slot primario, che infatti resta sul piano
// quando si restringe e diventa il frame in nuvola.

export const SLOT_MEDIA = [
${slotMedia
  .map(
    (item) =>
      `  { src: '${srcOf({ item, base: GALLERY_URL_BASE })}', type: '${item.type}', width: ${NORMALIZED_WIDTH}, height: ${normalizedHeight(item)} },`,
  )
  .join('\n')}
];

export const INTRO_SLIDES = [
${introSlides.map((slide) => `  '${srcOf(slide)}',`).join('\n')}
];
`;

writeFileSync(OUT_FILE, module_);
console.log(
  `scan-images: img2 ${galleryImages.length} immagini + ${galleryVideos.length} video -> ${SLOT_COUNT} slot ` +
    `(${slotMedia.filter((item) => item.type === 'video').length} video in nuvola); ` +
    `dab ${introImages.length} immagini -> ${wantedFromIntroDir} slide + 1 dal primario`,
);

// --- lettura e normalizzazione ------------------------------------------------

async function collectMedia(dir, label, { allowVideo, cap }) {
  if (!existsSync(dir)) {
    console.error(`scan-images: manca la cartella ${label}.`);
    process.exit(1);
  }
  const entries = readdirSync(dir);

  const heic = entries.filter((name) => HEIC_PATTERN.test(name));
  if (heic.length > 0) {
    console.error(
      `scan-images: ${label} contiene HEIC che la build non sa leggere: ${heic.join(', ')}. ` +
        'Convertili in JPEG, per esempio: sips -s format jpeg -s formatOptions best <file> --out <file>.jpg',
    );
    process.exit(1);
  }

  const unsupportedVideo = entries.filter((name) => UNSUPPORTED_VIDEO_PATTERN.test(name));
  if (unsupportedVideo.length > 0) {
    console.error(
      `scan-images: ${label} contiene video in un formato non supportato: ${unsupportedVideo.join(', ')}. ` +
        "Converti in MP4 (H.264): è l'unico che tutti i browser riproducono.",
    );
    process.exit(1);
  }

  const videos = entries.filter((name) => VIDEO_PATTERN.test(name));
  if (!allowVideo && videos.length > 0) {
    console.error(
      `scan-images: ${label} può contenere solo immagini, ma c'è ${videos.join(', ')}. ` +
        "Nell'animazione di apertura i video non compaiono.",
    );
    process.exit(1);
  }

  const names = entries
    .filter((name) => IMAGE_PATTERN.test(name) || (allowVideo && VIDEO_PATTERN.test(name)))
    .sort();

  if (names.length === 0) {
    console.error(`scan-images: nessun media utilizzabile in ${label}.`);
    process.exit(1);
  }

  const media = [];
  for (const name of names) {
    media.push(
      VIDEO_PATTERN.test(name) ? await describeVideo(dir, name) : await normaliseImage(dir, name, cap),
    );
  }
  return media;
}

async function describeVideo(dir, name) {
  const path = join(dir, name);
  const bytes = statSync(path).size;
  if (bytes > LARGE_VIDEO_WARNING_BYTES) {
    console.warn(
      `scan-images: ${name} pesa ${(bytes / 1024 / 1024).toFixed(1)} MB — ` +
        'valuta di ricomprimerlo, finisce nel repo e lo scarica ogni visitatore.',
    );
  }
  const { width, height, rotated } = await readVideoDimensions(path);
  console.log(`scan-images: video ${name} -> ${width}x${height}${rotated ? ' (ruotato 90°)' : ''}`);
  return { name, width, height, type: 'video', version: hashOf(path) };
}

async function normaliseImage(dir, name, cap) {
  const path = join(dir, name);
  const meta = await sharp(path).metadata();
  const needsRotation = meta.orientation !== undefined && meta.orientation !== 1;
  // Dopo la rotazione EXIF i lati possono scambiarsi: il limite va valutato
  // sulle dimensioni finali, non su quelle scritte nel file.
  const upright = needsRotation && meta.orientation >= 5
    ? { width: meta.height, height: meta.width }
    : { width: meta.width, height: meta.height };
  const capped = cappedSize(upright, cap);
  const needsResize = capped.width !== upright.width;
  const hasMetadata = meta.exif !== undefined || meta.icc !== undefined || meta.xmp !== undefined;
  // Il contenuto in uscita è sempre JPEG: se il nome dice altro, il server
  // annuncerebbe un MIME che non corrisponde e il browser rifiuterebbe il file.
  const needsJpegName = !/\.jpe?g$/i.test(name);

  let { width, height } = meta;
  if (!needsRotation && !needsResize && !hasMetadata && !needsJpegName) {
    return { name, width, height, type: 'image', version: hashOf(path) };
  }

  // .rotate() senza argomenti applica l'orientamento EXIF; l'output di sharp
  // non copia i metadati (niente EXIF/GPS) se non richiesto.
  let pipeline = sharp(path).rotate();
  width = capped.width;
  height = capped.height;
  if (needsResize) pipeline = pipeline.resize({ width });
  const buffer = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer();

  const finalName = freeJpegName(dir, name);
  writeFileSync(join(dir, finalName), buffer);
  if (finalName !== name) unlinkSync(path);
  console.log(
    `scan-images: normalizzata ${name}${finalName === name ? '' : ` -> ${finalName}`} ${width}x${height}`,
  );

  return { name: finalName, width, height, type: 'image', version: hashOf(join(dir, finalName)) };
}

/* Riduce alle dimensioni consentite mantenendo le proporzioni. img2 limita la
   larghezza (i frame in nuvola si guardano a fuoco, e li' conta la larghezza
   resa); dab limita il lato lungo, perche' una verticale a schermo intero
   spreca in altezza pixel che non si vedono. */
function cappedSize({ width, height }, cap) {
  if (!cap) return { width, height };
  const measured = cap.mode === 'longSide' ? Math.max(width, height) : width;
  if (measured <= cap.px) return { width, height };
  const factor = cap.px / measured;
  return { width: Math.round(width * factor), height: Math.round(height * factor) };
}

function freeJpegName(dir, name) {
  if (/\.jpe?g$/i.test(name)) return name;
  const base = name.replace(/\.[^.]+$/, '');
  let candidate = `${base}.jpg`;
  for (let n = 2; existsSync(join(dir, candidate)); n += 1) candidate = `${base}-${n}.jpg`;
  return candidate;
}

function hashOf(path) {
  return createHash('md5').update(readFileSync(path)).digest('hex').slice(0, 8);
}
