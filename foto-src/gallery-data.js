// Il layout della nuvola: 20 slot con posizioni (unita' mondo), colori e
// flag isPrimary — sono i dati CMS reali del riferimento [CMS], vedi
// ANALYSIS.md §4. I media NON stanno qui: vengono da public/img, unica
// fonte di verita', mappati sugli slot da scripts/scan-images.mjs (eseguito
// automaticamente prima di dev/build) nel modulo generato
// src/gallery-images.generated.js. Ogni slot porta con se' un `type`
// ('image' o 'video'): lo slot primario e' sempre un'immagine, perche' e'
// anche l'ultima slide dell'intro e nell'intro i video non compaiono.
// Descrizioni (exhibitionName/artistName) vuote di proposito: la caption in
// focus non mostra nulla.

import { SLOT_MEDIA, INTRO_SLIDES } from './src/gallery-images.generated.js';

const LAYOUT = [
  { id:  1, position: { x:   -4.5, y:  0.0, z: -12.0 }, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#E98822' },
  { id:  2, position: { x:  -13.0, y:  0.5, z:  -8.0 }, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#CE584E' },
  { id:  3, position: { x:   -7.0, y: -3.5, z:  -5.0 }, isPrimary: false, backgroundColor: '#F3FEC5', highlightColor: '#000000' },
  { id:  4, position: { x:  -12.0, y: -1.0, z: -15.5 }, isPrimary: false, backgroundColor: '#f3f3f3', highlightColor: '#2362B7' },
  { id:  5, position: { x:  -6.25, y: -3.5, z: -11.0 }, isPrimary: false, backgroundColor: '#FA86A9', highlightColor: '#ffffff' },
  { id:  6, position: { x:   -2.0, y: -7.0, z: -12.0 }, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#83CE57' },
  { id:  7, position: { x:    5.0, y: -4.0, z: -14.0 }, isPrimary: false, backgroundColor: '#907ED8', highlightColor: '#ffffff' },
  { id:  8, position: { x:    6.5, y: -8.0, z: -10.0 }, isPrimary: false, backgroundColor: '#000000', highlightColor: '#ffffff' },
  { id:  9, position: { x:    7.0, y: -3.0, z:  -4.5 }, isPrimary: false, backgroundColor: '#1F1E4D', highlightColor: '#ffffff' },
  { id: 10, position: { x:   11.0, y:  2.0, z: -19.0 }, isPrimary: false, backgroundColor: '#1E1E1E', highlightColor: '#F9DCA1' },
  { id: 11, position: { x:   15.5, y: -1.0, z: -20.0 }, isPrimary: false, backgroundColor: '#FAE9D7', highlightColor: '#194d25' },
  { id: 12, position: { x:   15.0, y:  2.0, z: -13.0 }, isPrimary: false, backgroundColor: '#000000', highlightColor: '#d9d9d9' },
  { id: 13, position: { x:    0.0, y:  0.0, z:   0.0 }, isPrimary: true,  backgroundColor: '#f4efc9', highlightColor: '#3F6631' },
  { id: 14, position: { x:   -3.0, y:  8.5, z: -12.0 }, isPrimary: false, backgroundColor: '#130506', highlightColor: '#FF3535' },
  { id: 15, position: { x:    4.0, y:  6.0, z:  -9.0 }, isPrimary: false, backgroundColor: '#E4EEFA', highlightColor: '#FF6600' },
  { id: 16, position: { x:   -5.0, y:  4.5, z: -15.0 }, isPrimary: false, backgroundColor: '#024442', highlightColor: '#ffffff' },
  { id: 17, position: { x:    2.0, y:  4.0, z: -11.0 }, isPrimary: false, backgroundColor: '#667643', highlightColor: '#EFE9D7' },
  { id: 18, position: { x:   -7.0, y:  4.0, z:  -7.0 }, isPrimary: false, backgroundColor: '#EFFDFD', highlightColor: '#000000' },
  { id: 19, position: { x:  -10.0, y:  6.0, z:  -5.0 }, isPrimary: false, backgroundColor: '#FBE6DD', highlightColor: '#263062' },
  { id: 20, position: { x:    7.0, y:  4.0, z:  -5.0 }, isPrimary: false, backgroundColor: '#ffffff', highlightColor: '#39ff14' },
];

export default LAYOUT.map((slot, index) => ({
  ...slot,
  ...SLOT_MEDIA[index],
  exhibitionName: '',
  artistName: '',
}));

export { INTRO_SLIDES };
