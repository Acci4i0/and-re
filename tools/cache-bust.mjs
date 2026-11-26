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

/* Prima i media citati dentro i file JS. Le foto di work/ stanno in
   work/progetti.js e non in un <img> dell'HTML: senza questo passaggio una
   foto rifatta con lo stesso nome restava per ore quella vecchia nel browser
   di chi aveva gia' aperto la pagina (e' successo con i segnaposto).
   Va fatto prima dell'HTML: cambia il contenuto del JS, quindi la sua impronta. */
function fileJs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    return statSync(p).isDirectory() ? fileJs(p) : (nome.endsWith(".js") ? [p] : []);
  });
}
let media = 0;
for (const js of fileJs(RADICE)) {
  const base = dirname(js);
  const originale = readFileSync(js, "utf8");
  const nuovo = originale.replace(
    /(["'])([^"'?:#\s]+\.(?:jpe?g|png|webp|avif|gif|mp4|webm))\1/g,
    (intero, q, percorso) => {
      if (percorso.startsWith("/") || percorso.startsWith("http")) return intero;
      const file = resolve(base, percorso);
      if (!existsSync(file) || relative(resolve(RADICE), file).startsWith("..")) return intero;
      media++;
      return `${q}${percorso}?v=${impronta(file)}${q}`;
    }
  );
  if (nuovo !== originale) writeFileSync(js, nuovo);
}
console.log(`  versionati ${media} richiami a media nei JS`);

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
