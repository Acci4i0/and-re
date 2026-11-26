# ANIMATION_SPEC — cartella "work"

Riferimento: https://www.mirceadaniel.com/ · analizzato il 26/11/2026 · Chromium 390×844, DPR 3, `isMobile` + `hasTouch`.

Materiale grezzo (solo locale, gitignorato): `_analysis/raw/mircea/`: bundle JS e CSS, timeline rAF dell'intro
(`intro-ref.json`, 526 campioni), interazioni (`inter-ref.json`), ~340 fotogrammi, contact sheet.

---

## 0. Cosa NON è il sito (correzioni al brief)

| Il brief dice | In realtà |
|---|---|
| "bundle JS di Framer", spring con stiffness/damping | È **Next.js** (Turbopack). **Nessun Framer Motion, nessuna spring**: zero occorrenze di `stiffness`, `damping`, `useSpring`, `whileInView`. Tutto è un motore rAF scritto a mano + transizioni CSS con `cubic-bezier`. |
| "anello 3D di immagini" | Non c'è su mirceadaniel.com. È dentro **AERO4**, uno dei template venduti (un sito Framer separato). Fuori perimetro. |
| scroll smooth/inerziale | **Lenis 1.3.27**, `lerp: 0.1`, `smoothWheel: true`, ma **solo** con `(hover: hover) and (pointer: fine)` e senza reduced-motion. Su telefono lo scroll è **nativo**. |
| marquee / carousel | Nessuno. La home è una colonna verticale infinita pilotata dallo scroll. |

Conseguenza per l'implementazione: invece di Framer Motion porto **gli stessi numeri** (curve, durate, formule)
in JS/CSS vanilla, come il resto del sito. Con Framer Motion dovrei approssimare delle curve che qui sono esatte.

---

## 1. Token globali

```
--margin: 12px          --gutter: 12px
font: Switzer 12px / line-height 1, UPPERCASE, antialiased
--ease-mask:  cubic-bezier(0.77, 0, 0.175, 1)    reveal immagini
--ease-glide: cubic-bezier(0.62, 0, 0.14, 1)     motore della home ("s")
              cubic-bezier(0.45, 0, 0.2, 1)      fade delle copertine nell'intro ("d")
--ease-text:  cubic-bezier(0.16, 1, 0.3, 1)      righe di testo mascherate
--ease-page:  cubic-bezier(0.27, 0, 0.51, 1)     fade pagina (fallback)
--ease-panel: cubic-bezier(0.16, 0.84, 0.44, 1)  pannello About
--ease-rise:  cubic-bezier(0.23, 1, 0.32, 1)     testo che sale
--ease-wipe:  cubic-bezier(0.5, 0, 0.1, 1)       transizione tra pagine
--rise-duration 1.4s · --rise-distance 20px · --rise-stagger 90ms
--mask-duration 1.4s · --page-duration 0.25s · --wipe-duration 0.9s
z: footer 8 · nav 9 (+1) · veil 90
```

Scrollbar nascosta ovunque. `html[data-scroll-lock]` → `overflow:hidden; overscroll-behavior:none`.

---

## 2. Home — la colonna infinita

### 2.1 Struttura
- N progetti, ognuno **ripetuto 6 volte** (5 progetti → 30 item). Ogni item:
  `tile` (link, 4:3, sfondo `#e9e9e9`, `overflow:hidden`) → `cover` (img alta **125%**, `top:-12.5%`)
  + `box` (sovrapposto al tile su mobile) → `media` (seconda immagine o video, `opacity:0`).
- Tile su mobile: larghezza `100vw − 2·12` = **366×274,5 px**, `left: 12px`.
- Lo stage è `position:fixed; height:100lvh; overflow:hidden`; un div spacer dà l'altezza al documento:
  `spacer = round(pitch · N · 240)` con `pitch = tileH + 12`.
  **Verificato**: 287 · 5 · 240 = **344 400 px**, identico all'altezza misurata della pagina.
- Allo start lo scroll viene portato a metà (`L = spacer/2`).

### 2.2 Stato a regime (dopo l'intro)
| cosa | regola |
|---|---|
| posizione | `q = (scrollY − C) / pitch`; item `i` a `y = vh/2 + rel(i,q)·pitch` (`rel` avvolto in ±N·3), `translate3d(0, y − tileH/2, 0)` |
| culling | item fuori da `[−60, vh+60]` → `visibility:hidden` |
| loop | se lo scroll è fermo da **400 ms** e `|scrollY − L| > 0,8·L` → salto istantaneo di un multiplo di `pitch·N` (invisibile) |
| parallax copertina | `translateY = (clamp((vh − top)/(vh + h), 0, 1) − 0,5) · 2 · tileH · 0,05` (0,11 sopra i 1200 px: mai, siamo mobile) |
| item attivo | quello più vicino al centro → `data-active`; il suo video parte (muted), gli altri in pausa |
| media attiva | `opacity 0→1`, **1 s** `cubic-bezier(0.4, 0, 0.2, 1)`, solo quando è caricata (`data-ready`) |
| video | `src` assegnato pigramente quando `|rel| < 1,5`; `preload:none` |
| didascalia centrale | riga fissa a `top: vh/2`, `mix-blend-mode: difference`, bianca. Su mobile solo **nome** (sx) e **prezzo** (dx). A ogni cambio di progetto la riga viene rimontata: ogni parola sale da `translateY(125%)` in **0,9 s** `--ease-text`, stagger **50 ms** |
| scroll | nativo su touch; Lenis `lerp 0.1` con mouse |

### 2.3 Intro (prima visita della sessione)
`sessionStorage["…-intro-played"]` → l'intro si vede una volta per sessione; dopo si salta direttamente a regime.
Il motore parte quando le copertine sono decodificate (`img.decode()`, timeout 4 s), **+150 ms**.
Durante l'intro: scroll bloccato, item `inert`, tile con sfondo **nero** (`data-developing`), nav e didascalia nascoste.

Tempi in secondi da `t=0` (= decode + 150 ms). Misurato: UI a +6,25 s e interattivo a +7,75 s,
corrispondenti al codice entro un fotogramma.

| t (s) | elemento | proprietà | from → to | durata | curva |
|---|---|---|---|---|---|
| 0,15 + 0,065·k | tile (k = ordine, 0…16) | `clip-path: inset(X% 0 0 0)` | 100% → 0 (si "sviluppa" dal basso) | 1,05 | glide |
| idem | cover | `scale` | 1,18 → 1 | 1,05 | glide |
| 0,55 + 0,065·k | cover | `opacity` / `blur` | 0 → 1 / 5 px → 0 | 1,35 | (0.45,0,0.2,1) |
| 1,75 | tutta la colonna | `scale` dei tile | 0,16 → 0,875 | 2,3 | glide |
| 1,75 | spaziatura | gap tra tile | 14 px → 0 | 2,3 | glide |
| 2,30 | colonna | rotazione verso il basso | accelera (cubica) 1,3 s → costante 0,45 s → frena (easeOutQuart) 3 s; in tutto **3 item**, velocità di crociera 1,837 item/s | 4,75 | vedi sopra |
| 5,55 | colonna | `scale` / gap | 0,875 → 1 / 0 → 12 px | 1,5 | glide |
| 6,25 | nav | righe `translateY(125%) → 0` | | 1,25, stagger 85 ms | ease-text |
| 6,25 | didascalia | idem | | 1,25, stagger 85 ms | ease-text |
| 6,25 + 0,1·min(d,4) | box (d = distanza dal centro) | `clip-path` | inset 100% → 0 | 1,5 | glide |
| 7,75 | — | sblocco scroll, `inert` tolto, sfondo nero tolto | | | |

Ordine `k`: `r = ceil((vh/2) / (0,16·tileH + 14))` (= 8 a 844 px), `k = clamp(r − rel, 0, 2r)`:
si sviluppano prima i tile in basso e poi a salire.

Fotogrammi: strisce nere sottili che si riempiono → foto che emergono dal nero → la colonna gira e cresce →
si ferma sul primo progetto, la seconda immagine sale sopra il tile, compaiono nav e didascalia.

---

## 3. Navigazione (mobile)
- Nav `fixed`, alta `100dvh`, `mix-blend-mode: difference`, testo bianco, `pointer-events:none` tranne i link.
- Riga alta (padding 12, safe-area): **wordmark** a sx (con un glifo 10 px tra due parole), **indice** a dx.
- Riga bassa: **ABOUT** a sx, **FAQ** a dx.
- Ogni voce è una riga mascherata (`overflow:hidden`): `translateY(125%) → 0`, transizione **1,25 s** `--ease-text`,
  ritardo `i · 85 ms` (i = 0…4). Area di tap estesa: `inset: -17px -8px` con `pointer: coarse`.

## 4. Pannello About
- Apertura: scrim `rgba(bianco, 0,72)` + `backdrop-filter: blur(10px)`; contenuto e footer `opacity 0→1`.
  Tutto **0,5 s** `--ease-panel`. In chiusura `visibility` scatta dopo 0,5 s.
- La nav resta sopra (difference). Scroll bloccato, Lenis fermo, Esc chiude, tap sullo scrim chiude,
  focus intrappolato nel pannello.
- Testo `none`-case 12/1.5 opacità 0,7; link sottolineati (offset 3 px) a distanza 48 px.

## 5. Transizione tra pagine
- Con View Transitions: la pagina **nuova** entra con `clip-path: inset(100% 0 0 0) → inset(0)` (tendina dal basso),
  la **vecchia** va a `translateY(-12vh)` + `brightness(0.4)`. **0,9 s** `--ease-wipe`, entrambe.
- Senza: la pagina va a `opacity 0` in 0,25 s (`--ease-page`), si naviga a 250 ms, la nuova entra con fade
  0,25 s dopo 0,1 s.
- Misurato al tap su un tile: tendina completa in ~0,9 s, poi il testo della pagina progetto sale.

## 6. Pagina progetto (mobile)
Struttura: BACK → titolo → descrizione → griglia meta 2 colonne (TAG · PIATTAFORMA · PREZZO · LINK)
→ copertina 4:3 → immagini 4:3 una sotto l'altra (gap 20) → NEXT PROJECT.
Padding: `0 12px`; info `padding-top:100px`, gap 32; media `padding-bottom:100px`.

**Testo che sale** (`rise`): `opacity 0→1` + `translateY(20px)→0`, **1,4 s** `--ease-rise`,
ritardo `delay + riga·90 ms`. Le descrizioni sono spezzate **per parola** e la riga viene misurata a runtime
(`offsetTop`) dopo il caricamento dei font.

| elemento | delay (s) |
|---|---|
| BACK (← + testo) | 0,5 |
| titolo | 0,6 |
| descrizione (per parola) | 0,7 + riga·0,09 |
| etichette TAG / PIATTAFORMA | 0,8 |
| valori (liste: + riga·0,09) | 0,9 |
| etichette PREZZO / LINK | 1,0 (durata 2 s) |
| prezzo, link | 1,1 |

**Reveal immagini** (`mask-reveal`), parte appena l'elemento è nel DOM (non allo scroll):
contenitore `clip-path: inset(100% 0 0 0) → inset(0)`; figlio `blur(7px) translateY(9%) scale(1.09) → nitido`
(il blur è già a 0 al 65%). **1,4 s** `--ease-mask`.
Ritardo = livello (copertina: 0,12 s; altre: 0) + `min(0,07·n, 0,35)` con n = ordine di comparsa.

**Parallax immagini**: `scale 1.06`, `translate = (avanzamento − 0,5)·2·altezzaFrame·0,025`,
attivo solo per gli elementi entro `rootMargin 25%`.

**Video**: play/pausa con IntersectionObserver (`threshold 0`), muted, loop, `preload:metadata`.

**NEXT PROJECT** (su mobile è solo un bottone; il "trascina per andare avanti" esiste solo sopra i 1200 px):
larghezza piena, `border-top 1px`, min 44 px, padding 14/0, "NEXT PROJECT" a sx e "→" a dx.
Alla pressione `opacity .45` (0,12 s lineare); al rilascio naviga solo se il dito si è mosso < 12 px e lo scroll < 4 px.
Il progetto successivo viene pre-caricato.

## 7. Indice progetti (mobile)
Una colonna, gap 20, padding `100px 12px`. Ogni voce: `01 - Nome - Tipo` (rise, delay 0,4 s)
+ riga di due immagini (gap 12, rapporto 1,33) con mask-reveal, stagger 0,07 s fino a 0,35.

## 8. Reduced motion
Niente intro, niente Lenis, niente parallax; testi e immagini già al loro posto; transizioni tra pagine istantanee;
i video non partono da soli.

---

## 9. Colonna mobile su desktop
- Nessun breakpoint: **sempre e solo** le regole sotto gli 810 px.
- Il documento scorre come al solito, ma tutto ciò che si vede sta in una colonna larga **390 px** centrata;
  i livelli `fixed` (stage, nav, didascalia, About, velo) sono vincolati alla colonna, non alla finestra.
- Fuori dalla colonna: sfondo neutro uniforme.
- Il motore usa la larghezza della colonna, non della finestra.
- Con il mouse lo scroll passa da Lenis (come l'originale su un dispositivo con puntatore fine).

---

## 10. Come lo porto in "work"
- `al/work/`, stessa logica di `info/`: HTML/CSS/JS vanilla, nessun build. Lenis copiato in locale (MIT).
- `work/index.html` = home a colonna · `work/progetti.html` = indice · `work/progetto.html?p=slug` = dettaglio.
  Dati dei progetti in un solo file (`work/progetti.js`): aggiungere un progetto = aggiungere un oggetto.
- Transizioni tra pagine con le View Transitions cross-document (`@view-transition`), fallback a fade.
- Nella home la cartella nera prende l'etichetta **work** e punta a `work/`.
- Nessun testo, nome, glifo o immagine dell'originale: solo la meccanica.

## 11. Da decidere prima di implementare
1. **Voci della nav** (l'originale ne ha 4: wordmark, indice, ABOUT, FAQ). Proposta: `ANDRE` · `PROGETTI` ·
   `ABOUT` · `DESKTOP` (torna alla home con le cartelle). La pagina FAQ non la porterei.
2. **Prezzo** nella didascalia a destra: per i tuoi lavori al suo posto metterei l'anno o il tipo
   ("sito web", "brand").
3. **Foto**: `/assets/photos` non esiste. Ho trovato `~/Desktop/estetica skincare`, `~/Desktop/fase/foto_fase`,
   `~/Desktop/fase/sito-fase`. Finché non mi dici quali usare, metto segnaposto.
4. **master.html** (la pagina delle opere a cui oggi punta la cartella nera) resterebbe online ma senza link.
   Va bene, o la sposto da un'altra parte?
