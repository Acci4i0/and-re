/* Pannelli del menu.

   Come nell'originale: una voce aperta chiude l'altra, si chiude cliccando
   fuori o con Escape, e la pastiglia resta accesa (.active) finche' il suo
   pannello e' aperto. Senza JavaScript i pannelli restano chiusi e la griglia
   funziona lo stesso: le card sono link veri. */

(function () {
  "use strict";

  var voci = [].slice.call(document.querySelectorAll("[data-accordion]")).map(function (bottone) {
    return { bottone: bottone, pannello: document.getElementById(bottone.getAttribute("aria-controls")) };
  }).filter(function (v) { return v.pannello; });

  if (!voci.length) return;

  function apri(voce, aperto) {
    voce.pannello.hidden = !aperto;
    voce.bottone.setAttribute("aria-expanded", String(aperto));
    voce.bottone.classList.toggle("active", aperto);
  }

  function chiudiTutto(tranne) {
    voci.forEach(function (v) { if (v !== tranne) apri(v, false); });
  }

  voci.forEach(function (voce) {
    voce.bottone.addEventListener("click", function (e) {
      e.stopPropagation();
      var eraAperto = !voce.pannello.hidden;
      chiudiTutto(voce);
      apri(voce, !eraAperto);
    });
    // un click dentro il pannello non lo deve chiudere
    voce.pannello.addEventListener("click", function (e) { e.stopPropagation(); });
  });

  document.addEventListener("click", function () { chiudiTutto(null); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") chiudiTutto(null);
  });
})();
