/* I progetti della cartella "work". E' l'unico file da toccare per aggiungerne
   o cambiarne uno: home, indice e pagina di dettaglio leggono tutti da qui.

   Ogni progetto:
     slug        indirizzo: progetto.html?p=<slug>
     titolo      nome mostrato
     tipo        cosa e' ("sito web", "brand"...)
     anno        va a destra nella didascalia della home, dove l'originale
                 mette il prezzo
     descrizione due-tre righe; puo' contenere <a href="...">link</a>
     tag         lista
     link        [{ etichetta, href }] — se vuota, la colonna LINK sparisce
     cover       la foto del tile in home e la prima della pagina
     media       le altre; la prima compare sopra il tile quando e' al centro.
                 Al posto di una foto si puo' mettere un video:
                 { video: "…mp4", poster: "…jpg", w, h, alt }

   Le foto ora sono SEGNAPOSTO (work/assets/photos/<slug>/). Testi, anni e
   link sono da riempire. */

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
      anno: "2026",
      descrizione:
        "Testo segnaposto. Una frase su che cosa e' il progetto, una su che cosa hai fatto tu e una su come e' andata.",
      tag: ["Sito web", "Beauty", "Segnaposto"],
      link: [],
      cover: { src: "assets/photos/estetica-skincare/cover.jpg", w: 1600, h: 1200, alt: "" },
      media: [
        { src: "assets/photos/estetica-skincare/01.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/estetica-skincare/02.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/estetica-skincare/03.jpg", w: 1600, h: 1200, alt: "" },
      ],
    },
    {
      slug: "fase",
      titolo: "Fase",
      tipo: "Sito web",
      anno: "2026",
      descrizione:
        "Testo segnaposto. Una frase su che cosa e' il progetto, una su che cosa hai fatto tu e una su come e' andata.",
      tag: ["Sito web", "Industria", "Segnaposto"],
      link: [],
      cover: { src: "assets/photos/fase/cover.jpg", w: 1600, h: 1200, alt: "" },
      media: [
        { src: "assets/photos/fase/01.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/fase/02.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/fase/03.jpg", w: 1600, h: 1200, alt: "" },
      ],
    },
    {
      slug: "vibrloux",
      titolo: "Vibrloux",
      tipo: "Brand",
      anno: "2026",
      descrizione:
        "Testo segnaposto. Una frase su che cosa e' il progetto, una su che cosa hai fatto tu e una su come e' andata.",
      tag: ["Brand", "Segnaposto"],
      link: [],
      cover: { src: "assets/photos/vibrloux/cover.jpg", w: 1600, h: 1200, alt: "" },
      media: [
        { src: "assets/photos/vibrloux/01.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/vibrloux/02.jpg", w: 1600, h: 1200, alt: "" },
        { src: "assets/photos/vibrloux/03.jpg", w: 1600, h: 1200, alt: "" },
      ],
    },
  ],
};
