import * as THREE from 'three';

/**
 * Texture di debug per lo slideshow dell'intro (DEBUG_INTRO_SLIDES): una per
 * passo, tonalità di grigio crescente con il numero del passo al centro,
 * così lo scambio — invisibile coi placeholder neri — si vede a occhio.
 * Solo strumento di sviluppo: non esiste nel riferimento.
 */
export function createDebugSlideTextures(count) {
  return Array.from({ length: count }, (_, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const shade = Math.round(30 + (index * (200 - 30)) / (count - 1));
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = shade > 128 ? '#000000' : '#ffffff';
    ctx.font = 'bold 320px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
}
