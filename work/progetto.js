/* Pagina di un progetto: progetto.html?p=<slug>. Struttura e tempi in
   ANIMATION_SPEC.md §6 (mobile) e §12 (desktop). */

(function () {
  "use strict";

  var W = window.WORK, Work = window.Work, esc = Work.esc;
  var html = document.documentElement;
  var VEIL_KEY = "andre-work-veil";
  var slug = new URLSearchParams(location.search).get("p");
  var p = Work.project(slug);
  if (!p) { location.replace("progetti.html"); return; }
  document.title = p.titolo + " — work";

  var ARROW_LEFT = '<svg class="back-arrow" viewBox="0 0 11 9" aria-hidden="true"><path d="M10.5 4.5H1M4.5 1 1 4.5 4.5 8" fill="none" stroke="currentColor"/></svg>';
  var ARROW_OUT = '<svg class="p-arrow" viewBox="0 0 9 9" aria-hidden="true"><path d="M1 8 8 1M2.5 1H8v5.5" fill="none" stroke="currentColor"/></svg>';
  var NEXT_LABEL = "SCORRI PER IL PROSSIMO PROGETTO";

  function rise(tag, delay, content, extra) {
    return "<" + tag + ' class="rise rise-block' + (extra && extra.cls ? " " + extra.cls : "") + '" style="--rise-delay:' + delay + "s" +
      (extra && extra.line ? ";--rise-line:" + extra.line : "") + (extra && extra.dur ? ";--rise-duration:" + extra.dur + "s" : "") + '">' +
      content + "</" + tag + ">";
  }

  function frame(m, level, number, label) {
    return '<figure class="p-figure"><div class="win" data-mask-reveal="' + level + '"><div class="win-frame" data-parallax-frame>' +
      Work.mediaTag(m, "win-media", ' loading="eager" data-image-parallax') + "</div></div>" +
      '<figcaption class="p-caption"><span class="p-number">' + rise("span", 0.2, esc(number) + " /") + "</span>" +
      rise("span", 0.2, esc(label)) + "</figcaption></figure>";
  }

  var entry = Work.readEntry();
  var all = W.progetti, m = all.length;
  var here = all.indexOf(p);
  var nextIdx = m > 1 ? (here + 1) % m : here;
  var nextHref = m > 1 ? "progetto.html?p=" + encodeURIComponent(all[nextIdx].slug) : "progetti.html";

  var cells =
    '<div class="p-cell"><dt class="p-label">' + rise("span", 0.8, "TAG") + '</dt><dd><ul class="p-tags">' +
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

  var markers = all.map(function (_, k) {
    return '<span class="next-marker" style="opacity:' + (k === here ? 1 : 0.2) + '"></span>';
  }).join("");

  document.getElementById("main").innerHTML =
    '<section class="p-section">' +
      '<div class="p-info">' +
        '<div class="back" data-entry="' + entry + '"><a class="back-link" href="' + (entry === "home" ? "./" : "progetti.html") + '"><div class="back-clip">' +
          rise("div", 0.5, ARROW_LEFT + "INDIETRO", { cls: "back-text" }) + "</div></a></div>" +
        '<div class="p-details">' +
          '<h1 class="p-title">' + rise("span", 0.6, esc(p.titolo)) + "</h1>" +
          '<p class="t-detail p-description" data-rise-text style="--rise-delay:0.7s">' + Work.riseWords(p.descrizione) + "</p>" +
        "</div>" +
        '<dl class="p-meta">' + cells + "</dl>" +
      "</div>" +
      '<div class="p-media">' +
        frame(p.cover, 2, "COVER", p.titolo) +
        '<ul class="p-grid">' + p.media.map(function (x, k) {
          return "<li>" + frame(x, 1, String(k + 1).padStart(2, "0"), x.etichetta || p.titolo) + "</li>";
        }).join("") + "</ul>" +
        '<div class="next-root">' +
          '<div class="next-bar">' +
            '<a class="next-label" href="' + nextHref + '">' +
              '<span class="next-text next-idle">' + NEXT_LABEL + "</span>" +
              '<span class="next-text next-fill" aria-hidden="true" data-label="' + NEXT_LABEL + '"></span>' +
            "</a>" +
            '<div class="next-markers" aria-hidden="true">' + markers + "</div>" +
          "</div>" +
          '<button type="button" class="next"><span>PROSSIMO PROGETTO</span><span aria-hidden="true">→</span></button>' +
        "</div>" +
      "</div>" +
    "</section>";

  var pre = document.createElement("link");
  pre.rel = "prefetch";
  pre.href = nextHref;
  document.head.appendChild(pre);

  /* arrivati scorrendo dal progetto prima: il velo bianco che copriva tutto
     sfuma via in 400ms (nel riferimento e' lo stesso velo, che sopravvive al
     cambio di pagina) */
  var arrived = false;
  try { arrived = sessionStorage.getItem(VEIL_KEY) === "1"; sessionStorage.removeItem(VEIL_KEY); } catch (_) {}
  if (arrived && !Work.reduced) {
    var cover = document.createElement("div");
    cover.className = "veil";
    cover.setAttribute("aria-hidden", "true");
    cover.style.cssText = "display:block;height:100%;opacity:1;transition:none";
    document.body.appendChild(cover);
    requestAnimationFrame(function () {
      cover.style.transition = "opacity 400ms ease-out";
      cover.style.opacity = "0";
    });
    setTimeout(function () { cover.remove(); }, 600);
  }

  /* ---------- PROSSIMO PROGETTO: il bottone (tablet, mobile, touch) ----------
     Alla pressione si attenua; al rilascio porta avanti solo se il dito non
     ha trascinato (12px) e la pagina non ha scorso (4px). */
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

  /* ---------- PROSSIMO PROGETTO: la barra (desktop con mouse) ----------
     Arrivati in fondo e fermi per 250ms, ogni giro di rotella in giu' riempie
     la scritta (2400px di rotella = piena) e alza un velo bianco sfocato sopra
     la pagina; in su la svuota. Piena: il velo copre tutto e dopo 360ms si
     passa al progetto dopo, senza tendina. */
  var bar = document.querySelector(".next-bar");
  var fill = document.querySelector(".next-fill");
  var marks = document.querySelectorAll(".next-marker");
  var MASK = "linear-gradient(to bottom, #000 calc(100% - 90px), rgba(0, 0, 0, 0) 100%)";
  var mq = window.matchMedia("(max-width: 1199.98px), (pointer: coarse)");
  var stop = null;

  function atBottom() {
    var max = Math.max(html.scrollHeight, document.body.scrollHeight) - window.innerHeight;
    return max <= 0 || max - (window.scrollY || html.scrollTop || 0) <= 6;
  }

  function enable() {
    var raf = 0, tGo = 0, tHard = 0, lastTouch = 0, mounted = performance.now();
    var target = 0, shown = 0, done = false, dwell = 0;
    var veil = document.createElement("div");
    veil.className = "veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    function paint(e) {
      fill.style.clipPath = "inset(0 " + (100 - Math.round(100 * e)) + "% 0 0)";
      for (var k = 0; k < marks.length; k++) {
        var o = 0.2;
        if (k === here) o = m > 1 ? 1 - 0.8 * e : 1;
        if (k === nextIdx && nextIdx !== here) o = 0.2 + 0.8 * e;
        marks[k].style.opacity = String(o);
      }
    }
    function resetVeil() {
      veil.style.transition = "none";
      veil.style.display = "none";
      veil.style.opacity = "0";
      veil.style.height = "0px";
      veil.style.setProperty("mask-image", MASK);
      veil.style.setProperty("-webkit-mask-image", MASK);
      veil.style.setProperty("backdrop-filter", "none");
      veil.style.setProperty("-webkit-backdrop-filter", "none");
    }
    function tick() {
      var e = Math.abs(target - shown) < 0.0015 ? target : shown + (target - shown) * 0.14;
      if (e !== shown) {
        shown = e;
        paint(e);
        if (!done) {
          if (e <= 0.001) { veil.style.display = "none"; veil.style.opacity = "0"; }
          else {
            var r = bar.getBoundingClientRect();
            veil.style.display = "block";
            veil.style.height = (r ? Math.max(0, r.top) : window.innerHeight) + "px";
            veil.style.opacity = String(0.9 * e);
            var bl = 8 * e, f = bl > 0.1 ? "blur(" + bl.toFixed(2) + "px)" : "none";
            veil.style.setProperty("backdrop-filter", f);
            veil.style.setProperty("-webkit-backdrop-filter", f);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }
    function reset() {
      clearTimeout(tGo); clearTimeout(tHard);
      done = false; target = 0; shown = 0; dwell = 0; mounted = performance.now();
      paint(0); resetVeil();
    }
    function push(dy) {
      if (done || performance.now() - mounted < 600 || html.hasAttribute("data-scroll-lock")) return;
      var d = Math.max(-120, Math.min(120, dy));
      if (d > 0) {
        if (atBottom()) {
          if (!dwell) dwell = performance.now();
          if (performance.now() - dwell < 250) return;
        } else { dwell = 0; target = 0; return; }
        target = Math.min(1, target + d / 2400);
        if (target >= 1) {
          target = 1;
          veil.style.display = "block";
          veil.style.height = "100%";
          veil.style.setProperty("mask-image", "none");
          veil.style.setProperty("-webkit-mask-image", "none");
          veil.style.transition = "opacity 320ms linear";
          veil.style.opacity = "1";
          done = true;
          tGo = setTimeout(function () {
            try { sessionStorage.setItem(VEIL_KEY, "1"); } catch (_) {}
            Work.navigate(nextHref, { instant: true });
          }, 360);
          tHard = setTimeout(function () { location.assign(nextHref); }, 2500);
        }
      } else if (d < 0) target = Math.max(0, target + d / 2400);
    }
    function onWheel(e) {
      if (e.ctrlKey || e.metaKey) return;
      push(e.deltaMode === 1 ? 16 * e.deltaY : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
    }
    function onTouchStart(e) { lastTouch = e.touches[0] ? e.touches[0].clientY : 0; }
    function onTouchMove(e) {
      var y = e.touches[0] ? e.touches[0].clientY : lastTouch;
      var d = (lastTouch - y) * 2;
      lastTouch = y;
      push(d);
    }
    function onScroll() { if (!done && !atBottom()) { dwell = 0; target = 0; } }
    function onShow(e) { if (e.persisted) reset(); }
    var passive = { passive: true };
    window.addEventListener("wheel", onWheel, passive);
    window.addEventListener("touchstart", onTouchStart, passive);
    window.addEventListener("touchmove", onTouchMove, passive);
    window.addEventListener("scroll", onScroll, passive);
    window.addEventListener("pageshow", onShow);
    resetVeil();
    paint(0);
    raf = requestAnimationFrame(tick);

    return function () {
      cancelAnimationFrame(raf);
      clearTimeout(tGo); clearTimeout(tHard);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onShow);
      veil.remove();
    };
  }

  function sync() {
    if (stop) { stop(); stop = null; }
    if (!mq.matches) stop = enable();
  }
  sync();
  mq.addEventListener("change", sync);

  Work.start("project");
})();
