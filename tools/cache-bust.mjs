/* Appende un numero di versione ai richiami di CSS e JS dentro _site.
 *
 * Perche' serve: GitHub Pages risponde con "cache-control: max-age=14400",
 * cioe' quattro ore. Chi ha caricato una pagina si tiene il suo style.css per
 * quel tempo, anche se online ne e' uscito uno nuovo. Durante una sessione di
 * lavoro vuol dire pubblicare correzioni che nessuno vede — e scambiare un
 * problema di cache per un bug, cosa gia' successa due volte.
 *
 * Il numero e' l'impronta del contenuto del file, non la data: se il file non
 * cambia, l'indirizzo non cambia e la cache continua a funzionare come deve.
 * Se cambia, per il browser e' un indirizzo nuovo e lo riscarica subito.
 *
 * I richiami vengono risolti rispetto alla cartella della pagina che li
 * contiene: info/index.html chiede "style.css" e intende info/style.css, non
 * quello della radice. */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve, relative } from "node:path";

const RADICE = "_site";

function paginaHtml(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? paginaHtml(p) : (nome.endsWith(".html") ? [p] : []);
  });
}

const impronte = new Map();
function impronta(file) {
  if (!impronte.has(file)) {
    impronte.set(file, createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 8));
  }
  return impronte.get(file);
}

let timbrati = 0;

for (const pagina of paginaHtml(RADICE)) {
  const base = dirname(pagina);
  const originale = readFileSync(pagina, "utf8");

  const nuovo = originale.replace(
    /(href|src)="([^"?:#]+\.(?:css|js))"/g,
    (intero, attr, percorso) => {
      if (percorso.startsWith("/") || percorso.startsWith("http")) return intero;
      const file = resolve(base, percorso);
      // solo file che esistono davvero e stanno dentro il sito
      if (!existsSync(file) || relative(resolve(RADICE), file).startsWith("..")) return intero;
      timbrati++;
      return `${attr}="${percorso}?v=${impronta(file)}"`;
    }
  );

  if (nuovo !== originale) writeFileSync(pagina, nuovo);
}

console.log(`  versionati ${timbrati} richiami a CSS e JS`);
