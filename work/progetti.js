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

   Foto e video vengono dalle pagine piu' belle di ciascun sito, non solo
   dalla homepage. Foto 4:3 (1600x1200); video 4:3 (1280x960, H.264, muti),
   ognuno con il suo poster jpg. Li produce lo script di cattura usato per
   work (fuori dal repo) (esteticaskincare.it, fasemec.com,
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
        { video: "assets/photos/estetica-skincare/filtri.mp4", poster: "assets/photos/estetica-skincare/filtri.jpg", w: 1600, h: 1200, etichetta: "TRATTAMENTI", alt: "I filtri dei trattamenti: Viso, Corpo, Massaggi" },
        { src: "assets/photos/estetica-skincare/trattamenti.jpg", w: 1600, h: 1200, etichetta: "TRATTAMENTI", alt: "Griglia dei trattamenti viso, ognuno con una foto" },
        { src: "assets/photos/estetica-skincare/tecnologia.jpg", w: 1600, h: 1200, etichetta: "TECNOLOGIA", alt: "Sezione Tecnologia: Starvac e pressoterapia Wave" },
        { src: "assets/photos/estetica-skincare/prodotti.jpg", w: 1600, h: 1200, etichetta: "PRODOTTI", alt: "Sezione Prodotti: la linea Skin Regimen" },
        { video: "assets/photos/estetica-skincare/hero.mp4", poster: "assets/photos/estetica-skincare/hero.jpg", w: 1600, h: 1200, etichetta: "HOMEPAGE", alt: "La crema in movimento dietro il nome, in apertura della homepage" },
        { video: "assets/photos/estetica-skincare/footer.mp4", poster: "assets/photos/estetica-skincare/footer.jpg", w: 1600, h: 1200, etichetta: "FOOTER", alt: "Il footer: il nome sale lettera per lettera sopra la crema" },
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
        { video: "assets/photos/fase/rosso.mp4", poster: "assets/photos/fase/rosso.jpg", w: 1600, h: 1200, etichetta: "HOMEPAGE", alt: "Il blocco rosso della homepage: il testo si colora scorrendo" },
        { src: "assets/photos/fase/metodo.jpg", w: 1600, h: 1200, etichetta: "HOMEPAGE", alt: "Il metodo: la citazione sull'umidita' residua sotto il 2%" },
        { src: "assets/photos/fase/applicazioni.jpg", w: 1600, h: 1200, etichetta: "APPLICAZIONI", alt: "Dal truciolo bagnato al truciolo asciutto: una punta che lavora sotto il getto di lubrorefrigerante" },
        { video: "assets/photos/fase/sequenza.mp4", poster: "assets/photos/fase/sequenza.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "Pagina Azienda: i tre passaggi del metodo, 01, 02, 03" },
        { src: "assets/photos/fase/kombi.jpg", w: 1600, h: 1200, etichetta: "PRODOTTO", alt: "Scheda dell'impianto compatto KOMBI" },
        { src: "assets/photos/fase/settori.jpg", w: 1600, h: 1200, etichetta: "SETTORI", alt: "Ogni reparto ha il suo truciolo: trucioli metallici in primo piano" },
        { video: "assets/photos/fase/footer.mp4", poster: "assets/photos/fase/footer.jpg", w: 1600, h: 1200, etichetta: "FOOTER", alt: "I numeri e il footer rosso con il logo Fase" },
      ],
    },
    {
      slug: "vibrolux",
      titolo: "Vibrolux",
      tipo: "Sito web",
      categoria: "Industria",
      anno: "2026",
      descrizione:
        "Il sito di Vibrolux, trattamenti superficiali dei metalli a Sant'Ambrogio di Torino: le lavorazioni, lo stabilimento e il percorso dal pezzo grezzo al controllo finale.",
      tag: ["Sito web", "Industria", "Next.js"],
      link: [{ etichetta: "VISITA", href: "https://acci4i0.github.io/vibrolux/" }],
      cover: { src: "assets/photos/vibrolux/cover.jpg", w: 1600, h: 1500, alt: "Homepage di Vibrolux: piastre su un nastro trasportatore e il titolo La finitura che si misura" },
      media: [
        { video: "assets/photos/vibrolux/numeri.mp4", poster: "assets/photos/vibrolux/numeri.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "Pagina Azienda: i numeri della sede salgono su fondo nero" },
        { src: "assets/photos/vibrolux/sacra.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "La Sacra di San Michele tra le nuvole, sopra Sant'Ambrogio" },
        { src: "assets/photos/vibrolux/citazione.jpg", w: 1600, h: 1200, etichetta: "AZIENDA", alt: "La citazione sullo stabilimento e il magazzino della sede" },
        { src: "assets/photos/vibrolux/lavorazioni.jpg", w: 1600, h: 1200, etichetta: "LAVORAZIONI", alt: "Le sei lavorazioni in una griglia di foto" },
        { src: "assets/photos/vibrolux/tribofinitura.jpg", w: 1600, h: 1200, etichetta: "TRIBOFINITURA", alt: "Tribofinitura isotropica: le vasche del reparto" },
        { video: "assets/photos/vibrolux/footer.mp4", poster: "assets/photos/vibrolux/footer.jpg", w: 1600, h: 1200, etichetta: "FOOTER", alt: "I pezzi finiti che scorrono e il logo Vibrolux che si compone" },
      ],
    },
  ],
};
