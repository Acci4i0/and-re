/* Pagina di un progetto: progetto.html?p=<slug>. Struttura e tempi in
   ANIMATION_SPEC.md §6. */

(function () {
  "use strict";

  var W = window.WORK, Work = window.Work, esc = Work.esc;
  var slug = new URLSearchParams(location.search).get("p");
  var p = Work.project(slug);
  if (!p) { location.replace("progetti.html"); return; }
  document.title = p.titolo + " — work";

  var ARROW_LEFT = '<svg class="back-arrow" viewBox="0 0 11 9" aria-hidden="true"><path d="M10.5 4.5H1M4.5 1 1 4.5 4.5 8" fill="none" stroke="currentColor"/></svg>';
  var ARROW_OUT = '<svg class="p-arrow" viewBox="0 0 9 9" aria-hidden="true"><path d="M1 8 8 1M2.5 1H8v5.5" fill="none" stroke="currentColor"/></svg>';

  function rise(tag, delay, content, extra) {
    return "<" + tag + ' class="rise rise-block' + (extra && extra.cls ? " " + extra.cls : "") + '" style="--rise-delay:' + delay + "s" +
      (extra && extra.line ? ";--rise-line:" + extra.line : "") + (extra && extra.dur ? ";--rise-duration:" + extra.dur + "s" : "") + '">' +
      content + "</" + tag + ">";
  }

  function frame(m, level) {
    return '<figure class="p-figure"><div class="win" data-mask-reveal="' + level + '"><div class="win-frame" data-parallax-frame>' +
      Work.mediaTag(m, "win-media", ' loading="eager" data-image-parallax') + "</div></div></figure>";
  }

  var entry = Work.readEntry();
  var i = W.progetti.indexOf(p);
  var next = W.progetti[(i + 1) % W.progetti.length];
  var nextHref = W.progetti.length > 1 ? "progetto.html?p=" + encodeURIComponent(next.slug) : "progetti.html";

  var cells =
    '<div class="p-cell"><dt class="p-label">' + rise("span", 0.8, "TAG") + "</dt><dd><ul class=\"p-tags\">" +
      p.tag.map(function (t, k) { return rise("li", 0.9, esc(t), { line: k }); }).join("") + "</ul></dd></div>" +
    '<div class="p-cell"><dt class="p-label">' + rise("span", 0.8, "TIPO") + "</dt>" + rise("dd", 0.9, esc(p.tipo)) + "</div>" +
    '<div class="p-cell"><dt class="p-label">' + rise("span", 1, "ANNO", { dur: 2 }) + "</dt>" + rise("dd", 1.1, esc(p.anno)) + "</div>" +
    (p.link.length
      ? '<div class="p-cell p-open"><dt class="p-label">' + rise("span", 1, "LINK", { dur: 2 }) + '</dt><dd><ul class="p-links">' +
          p.link.map(function (l) {
            return '<li class="p-link-row"><a class="p-link" href="' + esc(l.href) + '" target="_blank" rel="noopener"><div class="p-link-clip">' +
              rise("div", 1.1, esc(l.etichetta) + ARROW_OUT, { cls: "p-link-text" }) + "</div></a></li>";
          }).join("") + "</ul></dd></div>"
      : "");

  document.getElementById("main").innerHTML =
    '<section class="p-section">' +
      '<div class="p-info">' +
        '<div class="back"><a class="back-link" href="' + (entry === "home" ? "./" : "progetti.html") + '"><div class="back-clip">' +
          rise("div", 0.5, ARROW_LEFT + "INDIETRO", { cls: "back-text" }) + "</div></a></div>" +
        '<div class="p-details">' +
          '<h1 class="p-title">' + rise("span", 0.6, esc(p.titolo)) + "</h1>" +
          '<p class="t-detail p-description" data-rise-text style="--rise-delay:0.7s">' + Work.riseWords(p.descrizione) + "</p>" +
        "</div>" +
        '<dl class="p-meta">' + cells + "</dl>" +
      "</div>" +
      '<div class="p-media">' +
        frame(p.cover, 2) +
        '<ul class="p-grid">' + p.media.map(function (m) { return "<li>" + frame(m, 1) + "</li>"; }).join("") + "</ul>" +
        '<button type="button" class="next"><span>PROSSIMO PROGETTO</span><span aria-hidden="true">→</span></button>' +
      "</div>" +
    "</section>";

  var pre = document.createElement("link");
  pre.rel = "prefetch";
  pre.href = nextHref;
  document.head.appendChild(pre);

  /* PROSSIMO PROGETTO: alla pressione si attenua; al rilascio porta avanti solo
     se il dito non ha trascinato (12px) e la pagina non ha scorso (4px). */
  var btn = document.querySelector(".next");
  var down = null, lastGo = 0;
  function go() {
    var now = Date.now();
    if (now - lastGo < 700) return;
    lastGo = now;
    Work.navigate(nextHref);
  }
  function dim(v) { btn.style.opacity = v ? "0.45" : "1"; }
  function press(x, y) { down = { x: x, y: y, scroll: window.scrollY }; dim(true); }
  function release(x, y) {
    dim(false);
    var d = down;
    down = null;
    if (d && Math.hypot(x - d.x, y - d.y) <= 12 && Math.abs(window.scrollY - d.scroll) <= 4) go();
  }
  function cancel() { down = null; dim(false); }
  btn.addEventListener("click", go);
  btn.addEventListener("pointerdown", function (e) { press(e.clientX, e.clientY); });
  btn.addEventListener("pointerup", function (e) { if (e.pointerType === "mouse") dim(false); else release(e.clientX, e.clientY); });
  btn.addEventListener("pointercancel", cancel);
  btn.addEventListener("pointerleave", function () { dim(false); });
  btn.addEventListener("touchstart", function (e) { var t = e.touches[0]; if (t) press(t.clientX, t.clientY); }, { passive: true });
  btn.addEventListener("touchend", function (e) { var t = e.changedTouches[0]; if (t) release(t.clientX, t.clientY); });
  btn.addEventListener("touchcancel", cancel);

  Work.start("project");
})();
