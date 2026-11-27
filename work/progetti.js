/* I progetti della cartella "work". E' l'unico file da toccare per aggiungerne
   o cambiarne uno: home, indice e pagina di dettaglio leggono tutti da qui.

   Ogni progetto:
     slug        indirizzo: progetto.html?p=<slug>
     titolo      nome mostrato
     tipo        seconda colonna della didascalia in home (desktop)
     categoria   terza colonna della didascalia in home (desktop)
     anno        ultima colonna della didascalia, e cella ANNO nella pagina
     descrizione due-tre righe; puo' contenere <a href="...">link</a>
     tag         lista
     link        [{ etichetta, href }] — se vuota, la colonna LINK sparisce
     cover       la foto del tile in home e la prima della pagina. E' 16:15
                 (1600x1500), non 4:3: nel tile la copertina e' alta il 125%
                 per il parallax, e solo cosi' riempie la larghezza senza
                 tagli ai lati. Si vede la fascia centrale (l'80% dell'altezza).
     media       le altre; la prima compare accanto al tile (desktop) o sopra
                 (mobile) quando e' al centro. "etichetta" e' la didascalia
                 sotto l'immagine nella pagina, da 810px in su.
                 Al posto di una foto si puo' mettere un video:
                 { video: "…mp4", poster: "…jpg", w, h, alt }

   Le immagini sono screenshot dei siti online, in 4:3 (1600x1200), presi
   scorrendo la homepage di ciascuno (esteticaskincare.it, fasemec.com,
   acci4i0.github.io/vibrolux). Rifacendo una foto con lo stesso nome non
   serve cambiarlo: la build aggiunge al percorso l'impronta del file. Le descrizioni vengono dai siti stessi:
   da rivedere con parole tue. */

window.WORK = {
  nome: "ANDRE",
  about:
    "Testo segnaposto. Due o tre frasi su chi sei, che lavori fai e per chi. " +
    "Qui va il tono del sito, non un curriculum.",
  contatti: [
    { etichetta: "INSTAGRAM", href: "https://instagram.com/andrelndo" },
    { etichetta: "EMAIL", href: "mailto:lando.andrea04@gmail.com" },
  ],

  progetti: [
    {
      slug: "estetica-skincare",
      titolo: "Estetica Skincare",
      tipo: "Sito web",
      categoria: "Beauty",
      anno: "2026",
      descrizione:
        "Il sito di un centro estetico a San Giuseppe di Cassola, aperto dal 1990: trattamenti viso e corpo, tecnologie, e prenotazione su WhatsApp o al telefono.",
      tag: ["Sito web", "Beauty", "Centro estetico"],
      link: [{ etichetta: "VISITA", href: "https://esteticaskincare.it/" }],
      cover: { src: "assets/photos/estetica-skincare/cover.jpg", w: 1600, h: 1500, alt: "Homepage di Estetica Skincare: il nome in grande su una crema avorio, sotto l'elenco dei trattamenti" },
      media: [
        { src: "assets/photos/estetica-skincare/01.jpg", w: 1600, h: 1200, etichetta: "TRATTAMENTI", alt: "Griglia dei trattamenti viso, ognuno con una foto" },
        { src: "assets/photos/estetica-skincare/02.jpg", w: 1600, h: 1200, etichetta: "TRATTAMENTI", alt: "Altri trattamenti della griglia, tra volti e texture di creme" },
        { src: "assets/photos/estetica-skincare/03.jpg", w: 1600, h: 1200, etichetta: "TECNOLOGIA", alt: "Sezione Tecnologia, con le foto dei macchinari" },
      ],
    },
    {
      slug: "fase",
      titolo: "Fase",
      tipo: "Sito web",
      categoria: "Industria",
      anno: "2026",
      descrizione:
        "Il sito di Fase Mechanical Engineering: centrifughe, impianti e trituratori per il truciolo metallico, con una pagina per ogni prodotto.",
      tag: ["Sito web", "Industria", "Catalogo"],
      link: [{ etichetta: "VISITA", href: "https://fasemec.com/" }],
      cover: { src: "assets/photos/fase/cover.jpg", w: 1600, h: 1500, alt: "Homepage di Fase: una centrifuga in primo piano e il titolo Truciolo asciutto, fluido in circolo" },
      media: [
        { src: "assets/photos/fase/01.jpg", w: 1600, h: 1200, etichetta: "TECNOLOGIA", alt: "Primo piano di una catena di trasmissione con il marchio Fase" },
        { src: "assets/photos/fase/02.jpg", w: 1600, h: 1200, etichetta: "PRODOTTI", alt: "Ogni reparto ha il suo truciolo: le tre famiglie di prodotto, centrifughe, trituratori e impianti" },
        { src: "assets/photos/fase/03.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "Sezione scura con il titolo Resa misurata sul materiale" },
      ],
    },
    {
      slug: "vibrolux",
      titolo: "Vibrolux",
      tipo: "Sito web",
      categoria: "Industria",
      anno: "2026",
      descrizione:
        "Il sito di Vibrolux, trattamenti superficiali dei metalli a Torino: le lavorazioni, lo stabilimento e il percorso dal pezzo grezzo al controllo finale.",
      tag: ["Sito web", "Industria", "Next.js"],
      link: [{ etichetta: "VISITA", href: "https://acci4i0.github.io/vibrolux/" }],
      cover: { src: "assets/photos/vibrolux/cover.jpg", w: 1600, h: 1500, alt: "Homepage di Vibrolux: una linea di lavorazione e il titolo La finitura che si misura" },
      media: [
        { src: "assets/photos/vibrolux/01.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "Testo sull'azienda accanto a pezzi metallici e allo stabilimento" },
        { src: "assets/photos/vibrolux/02.jpg", w: 1600, h: 1200, etichetta: "LAVORAZIONI", alt: "Primi piani di pezzi metallici e dello stabilimento" },
        { src: "assets/photos/vibrolux/03.jpg", w: 1600, h: 1200, etichetta: "LAVORAZIONI", alt: "Elenco delle lavorazioni accanto a una foto di tubi metallici" },
      ],
    },
  ],
};
