#!/usr/bin/env bash
# Monta il sito pubblicabile in _site/.
#
# Il sito ha UN SOLO pubblicatore: GitHub Actions, che chiama questo script e
# carica _site. Prima ce n'erano due — c'era anche un Worker Cloudflare che
# pubblicava la radice del repo — e divergevano in silenzio: online finiva il
# sorgente della galleria e mancava /foto/, mentre la copia su GitHub Pages era
# corretta ma non la visitava nessuno.
#
# Tutto cio' che decide cosa viene pubblicato sta qui dentro e nel workflow,
# cioe' nel repo. Niente campi nascosti in un pannello di controllo.

set -euo pipefail

echo "--- costruisco la galleria 3D ---"
( cd foto-src && npm ci --no-audit --no-fund && npm run build )

echo "--- monto il sito ---"
rm -rf _site
mkdir -p _site

# Si monta una cartella a parte invece di pubblicare la radice: cosi' sorgente
# della galleria, dipendenze e file di lavoro restano fuori dal sito senza
# doverli elencare uno per uno.
rsync -a \
  --exclude '_site/' \
  --exclude 'foto-src/' \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.gitignore' \
  --exclude 'node_modules/' \
  --exclude '_analysis/' \
  --exclude '/cv/' \
  --exclude 'build.sh' \
  --exclude 'tools/' \
  --exclude '*.md' \
  --exclude 'LICENSE' \
  --exclude 'content:nuthoughts.rtf' \
  ./ _site/

mkdir -p _site/foto
cp -R foto-src/dist/. _site/foto/

echo "--- versiono CSS e JS contro la cache ---"
node tools/cache-bust.mjs

echo "--- pubblicato ---"
du -sh _site
ls _site
