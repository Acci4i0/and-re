/* Navigazione fra le opere della cartella nera.

   Stessa impostazione del tasto lingua di asterione: le opere stanno tutte
   nel documento e si alternano con [hidden]. Senza JavaScript resta visibile
   la prima, cioe' la pagina esattamente com'era prima di questa aggiunta.

   Non c'e' nessuna transizione, come in tutto il resto del sito: il cambio e'
   istantaneo. */

(function () {
  "use strict";

  var lastre = [].slice.call(document.querySelectorAll(".opera"));
  var didascalie = [].slice.call(document.querySelectorAll(".opera-didascalia"));
  var prec = document.getElementById("opera-prec");
  var succ = document.getElementById("opera-succ");
  var indice = document.getElementById("opera-indice");

  if (lastre.length < 2 || !prec || !succ) return;

  var corrente = 0;

  function mostra(n) {
    // L'anello: dall'ultima si torna alla prima e viceversa, cosi' le frecce
    // non diventano mai inattive.
    corrente = (n + lastre.length) % lastre.length;

    lastre.forEach(function (el, i) {
      var attiva = i === corrente;
      el.hidden = !attiva;
      // Un video fuori campo non deve continuare a girare: consuma e basta.
      var v = el.querySelector("video");
      if (v) { if (attiva) { v.play().catch(function () {}); } else { v.pause(); } }
    });

    didascalie.forEach(function (el, i) { el.hidden = i !== corrente; });
    indice.textContent = String(corrente + 1);
  }

  prec.addEventListener("click", function () { mostra(corrente - 1); });
  succ.addEventListener("click", function () { mostra(corrente + 1); });

  // Frecce della tastiera: su una galleria e' il gesto che viene naturale.
  document.addEventListener("keydown", function (e) {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowLeft") { mostra(corrente - 1); }
    else if (e.key === "ArrowRight") { mostra(corrente + 1); }
  });

  mostra(0);
})();
