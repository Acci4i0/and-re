import { open } from 'node:fs/promises';

/**
 * Dimensioni in pixel di un video MP4/MOV, senza dipendenze e senza ffprobe
 * (la build gira su ubuntu-latest in CI, dove non c'è).
 *
 * MP4, M4V e MOV sono tutti ISO base media file format: una sequenza di box
 * annidati. Le dimensioni stanno nel box `tkhd` (track header) della traccia
 * video, come fixed-point 16.16. La matrice di trasformazione nello stesso
 * box dice se la traccia è ruotata di 90° — è il caso dei video girati in
 * verticale col telefono, che altrimenti risulterebbero orizzontali.
 */

const BOXES_WITH_CHILDREN = new Set(['moov', 'trak', 'mdia']);
const HEADER_BYTES = 8;
const READ_LIMIT_BYTES = 64 * 1024 * 1024;

export async function readVideoDimensions(path) {
  const file = await open(path, 'r');
  try {
    const { size } = await file.stat();
    const buffer = Buffer.alloc(Math.min(size, READ_LIMIT_BYTES));
    await file.read(buffer, 0, buffer.length, 0);

    const track = findVideoTrack(buffer, 0, buffer.length);
    if (!track) {
      throw new Error(
        `impossibile leggere le dimensioni di ${path}: nessuna traccia video trovata. ` +
          'Formati supportati: MP4, M4V, MOV. Riesporta il file o convertilo in MP4.',
      );
    }
    return track;
  } finally {
    await file.close();
  }
}

/** Scende ricorsivamente nei box finché non trova un tkhd con dimensioni non nulle. */
function findVideoTrack(buffer, start, end) {
  let offset = start;

  while (offset + HEADER_BYTES <= end) {
    const { type, payloadStart, nextOffset } = readBoxHeader(buffer, offset, end);
    if (!nextOffset) break;

    if (type === 'tkhd') {
      const dimensions = readTrackHeaderDimensions(buffer, payloadStart);
      // Le tracce audio esistono ma hanno larghezza e altezza a zero.
      if (dimensions) return dimensions;
    } else if (BOXES_WITH_CHILDREN.has(type)) {
      const found = findVideoTrack(buffer, payloadStart, Math.min(nextOffset, end));
      if (found) return found;
    }

    offset = nextOffset;
  }

  return null;
}

function readBoxHeader(buffer, offset, end) {
  let size = buffer.readUInt32BE(offset);
  const type = buffer.toString('latin1', offset + 4, offset + 8);
  let payloadStart = offset + HEADER_BYTES;

  if (size === 1) {
    // size esteso a 64 bit, subito dopo il tipo
    if (payloadStart + 8 > end) return {};
    size = Number(buffer.readBigUInt64BE(payloadStart));
    payloadStart += 8;
  } else if (size === 0) {
    size = end - offset; // il box arriva a fine file
  }

  if (size < HEADER_BYTES) return {};
  return { type, payloadStart, nextOffset: offset + size };
}

function readTrackHeaderDimensions(buffer, payloadStart) {
  const version = buffer.readUInt8(payloadStart);

  // version+flags, poi creation/modification/track_id/reserved/duration:
  // 32 bit ciascuno in v0, 64 bit per i timestamp e la durata in v1.
  const timestampsBytes = version === 1 ? 32 : 20;
  // reserved(8) + layer(2) + alternate_group(2) + volume(2) + reserved(2)
  const matrixStart = payloadStart + 4 + timestampsBytes + 16;
  const dimensionsStart = matrixStart + 36;
  if (dimensionsStart + 8 > buffer.length) return null;

  const width = buffer.readUInt32BE(dimensionsStart) / 65536;
  const height = buffer.readUInt32BE(dimensionsStart + 4) / 65536;
  if (width < 1 || height < 1) return null;

  return isQuarterTurn(buffer, matrixStart)
    ? { width: Math.round(height), height: Math.round(width), rotated: true }
    : { width: Math.round(width), height: Math.round(height), rotated: false };
}

/**
 * La matrice è [a b u / c d v / x y w]. Una rotazione di ±90° azzera a e d
 * lasciando b e c non nulli, e scambia le dimensioni viste dal lettore.
 */
function isQuarterTurn(buffer, matrixStart) {
  const fixed = (index) => buffer.readInt32BE(matrixStart + index * 4) / 65536;
  const [a, b, , c, d] = [fixed(0), fixed(1), fixed(2), fixed(3), fixed(4)];
  return a === 0 && d === 0 && (b !== 0 || c !== 0);
}
