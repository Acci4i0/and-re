#!/usr/bin/env bash
# Monta il sito pubblicabile in _site/.
#
# Esiste perche' and-re.com NON e' servito da GitHub Pages: il dominio punta a
# Cloudflare Pages, che prende il repo e lo pubblica senza eseguire il workflow
# di GitHub. Finche' il montaggio viveva solo dentro il workflow, Cloudflare
# serviva la radice del repo — con dentro il sorgente della galleria e senza la
# galleria costruita.
#
# Ora i due pubblicatori chiamano lo stesso script:
#   GitHub Actions  -> bash build.sh, poi carica _site
#   Cloudflare Pages-> comando di build "bash build.sh", cartella di output "_site"
#
# Cosi' non possono piu' divergere.

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
  --exclude 'build.sh' \
  --exclude 'wrangler.toml' \
  --exclude '*.md' \
  --exclude 'LICENSE' \
  --exclude 'content:nuthoughts.rtf' \
  ./ _site/

mkdir -p _site/foto
cp -R foto-src/dist/. _site/foto/

echo "--- pubblicato ---"
du -sh _site
ls _site
