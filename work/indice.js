/* Indice dei progetti: una colonna, ogni voce con due immagini. §7 della spec. */

(function () {
  "use strict";

  var W = window.WORK, Work = window.Work, esc = Work.esc;

  function rise(tag, content, aria) {
    return "<" + tag + ' class="rise rise-block"' + (aria ? ' aria-hidden="true"' : "") + ' style="--rise-delay:0.4s">' + content + "</" + tag + ">";
  }

  document.getElementById("main").innerHTML =
    '<h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">Tutti i progetti</h1>' +
    '<section class="i-section" aria-label="Progetti"><ul class="i-list">' +
      W.progetti.map(function (p, k) {
        var second = p.anteprima || p.media[0] || p.cover;
        return '<li><a class="i-project" href="progetto.html?p=' + encodeURIComponent(p.slug) + '">' +
          '<div class="i-head">' + rise("p", String(k + 1).padStart(2, "0")) +
            '<div class="i-title">' + rise("span", "-", true) + rise("h2", esc(p.titolo)) + rise("span", "-", true) + rise("p", esc(p.tipo)) + "</div>" +
          "</div>" +
          '<div class="i-row">' +
            '<div class="i-frame" data-mask-reveal="1"><div>' + Work.mediaTag(p.cover, "", ' loading="eager"') + "</div></div>" +
            '<div class="i-frame" data-mask-reveal="1"><div>' + Work.mediaTag(second, "", ' loading="eager"') + "</div></div>" +
          "</div>" +
        "</a></li>";
      }).join("") +
    "</ul></section>";

  Work.rememberEntry("archive");

  Work.start("index");
})();
