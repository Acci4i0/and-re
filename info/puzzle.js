// ============================================================================
//  PUZZLE.JS — L'UNICO FILE DA MODIFICARE PER CREARE UN CRUCIVERBA
// ============================================================================
//
//  Per fare il cruciverba di una nuova persona, cambia solo i valori qui sotto
//  e ricarica la pagina: la griglia (portrait + landscape) e il footer con gli
//  indizi si rigenerano da soli, in automatico.
//
//  Regole per le risposte (answer):
//   - una sola parola, senza spazi
//   - vengono messe in MAIUSCOLO in automatico
//   - le parole devono CONDIVIDERE QUALCHE LETTERA tra loro, altrimenti il
//     cruciverba non puo incrociarsi (in locale, con ?dev, vedrai un avviso)
//
//  Numero di indizi: libero (il footer si divide da solo in due colonne).
// ============================================================================

const PUZZLE = {
  // Titolo della scheda del browser.
  title: "Andrea",

  // Gli indizi e le risposte. clue = la domanda mostrata sotto "INFO".
  clues: [
    { number: 1, clue: "Il mio nome",                answer: "ANDREA" },
    { number: 2, clue: "Ma mi chimano...",           answer: "ACCIAIO" },
    { number: 3, clue: "Laureato in:",               answer: "INGEGNERIA" },
    { number: 4, clue: "Più specifico",              answer: "GESTIONALE" },
    { number: 5, clue: "Che cosa faccio?",           answer: "SITIWEB" },
    { number: 6, clue: "Ma faccio anche",            answer: "SPORT" },
    { number: 7, clue: "Altra passione",             answer: "LIBRI" },
    { number: 8, clue: "Autore preferito?",          answer: "TABUCCHI" },
  ],

  // Contatti mostrati sotto "CONTACT" (di solito restano questi: sono i tuoi).
  contact: {
    mail: "lando.andrea04@gmail.com",
    tel: "+393337216052",            // usato nel link "chiama"
    telDisplay: "+39 3337216052",  // come viene mostrato
    instagram: "andrelndo",
    instagramUrl: "https://instagram.com/andrelndo",
    year: 2026,
  },
};
