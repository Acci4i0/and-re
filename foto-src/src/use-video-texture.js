import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Texture video per un piano della nuvola.
 *
 * Il <video> vive fuori dal DOM: serve solo come sorgente di pixel per la
 * texture. È in loop, muto e inline perché sono le tre condizioni che i
 * browser impongono per far partire la riproduzione senza un gesto
 * dell'utente — su iOS in particolare, dove senza `playsInline` il video
 * aprirebbe il player a schermo intero.
 */
export function useVideoTexture(src) {
  // Volutamente senza `src` e senza `autoplay`: l'elemento nasce inerte e lo
  // attiva l'effetto. React scarta i render che sospendono — e qui accade a
  // ogni retry del Suspense che avvolge la nuvola — quindi un elemento creato
  // durante il render può non ricevere mai la sua cleanup. Se nascesse già
  // con src e autoplay, quelle copie orfane scaricherebbero e riprodurrebbero
  // in sottofondo; così invece restano nodi vuoti che il GC si porta via.
  const video = useMemo(() => {
    const element = document.createElement('video');
    element.loop = true;
    element.muted = true;
    element.defaultMuted = true;
    element.playsInline = true;
    element.preload = 'auto';
    return element;
  }, [src]);

  const texture = useMemo(() => {
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    // Un video non ha mipmap: filtro lineare su entrambi, altrimenti three
    // prova a generarle a ogni frame.
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    return videoTexture;
  }, [video]);

  useEffect(() => {
    video.src = src;
    // play() può essere rifiutata dalle policy del browser: il piano resta
    // sul primo frame invece di animarsi, ma il rendering non si rompe.
    video.play().catch(() => {});
    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      texture.dispose();
    };
  }, [video, texture, src]);

  return { texture, video };
}
