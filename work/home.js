/* Home di work: la colonna infinita.

   E' la traduzione del motore del riferimento (ANIMATION_SPEC.md, §2), con
   gli stessi numeri: niente librerie di animazione, un solo ciclo rAF che a
   ogni fotogramma calcola posizione, scala e maschere di ogni tile a partire
   dal tempo (durante l'intro) o dallo scroll (dopo).

   Lo scroll non muove la colonna: muove un div alto centinaia di migliaia di
   pixel, e la colonna, che e' fissa, legge scrollY. Quando ci si ferma lontano
   dal centro dello spacer, si salta indietro di un multiplo esatto del giro
   dei progetti: siccome le copie sono identiche, il salto non si vede. */

(function () {
  "use strict";

  var W = window.WORK, Work = window.Work;
  var html = document.documentElement;

  /* ---------- markup ---------- */

  var P = W.progetti, b = P.length;
  // abbastanza copie da riempire anche uno schermo alto 1600px con i tile
  // rimpiccioliti dell'intro, senza che la stessa copia serva due volte
  var copies = Math.max(6, Math.ceil(36 / b));

  function boxMarkup(p) {
    var m = p.media[0] || p.cover;
    if (m.video) {
      return (m.poster ? '<img class="col-media" data-poster src="' + Work.esc(m.poster) + '" alt="" loading="lazy" decoding="async" draggable="false">' : "") +
        '<video class="col-media" data-media data-src="' + Work.esc(m.video) + '" muted loop playsinline preload="none" disablepictureinpicture></video>';
    }
    return '<img class="col-media" data-media src="' + Work.esc(m.src) + '" alt="" loading="lazy" decoding="async" draggable="false">';
  }

  var items = "";
  for (var c = 0; c < copies; c++) {
    for (var i = 0; i < b; i++) {
      var p = P[i];
      items +=
        '<div class="col-item" data-item data-project="' + i + '" data-copy="' + c + '">' +
          '<a class="col-tile" data-tile draggable="false" href="progetto.html?p=' + encodeURIComponent(p.slug) + '"' +
            ' aria-label="' + Work.esc(p.titolo + ", " + p.tipo + ", " + p.anno) + '"' + (c ? ' tabindex="-1" aria-hidden="true"' : "") + ">" +
            '<img class="col-cover" data-cover src="' + Work.esc(p.cover.src) + '" width="' + p.cover.w + '" height="' + p.cover.h + '"' +
              ' alt="' + Work.esc(p.cover.alt || "") + '"' + (c ? ' loading="lazy"' : ' loading="eager" fetchpriority="high"') + ' decoding="async" draggable="false">' +
          "</a>" +
          '<div class="col-box" data-box aria-hidden="true">' + boxMarkup(p) + "</div>" +
        "</div>";
    }
  }

  var root = document.getElementById("col");
  root.innerHTML =
    '<div class="col-spacer" aria-hidden="true"></div>' +
    '<div class="col-stage">' + items + "</div>" +
    '<div class="col-type" aria-hidden="true"></div>';

  var spacer = root.firstChild;
  var stage = spacer.nextSibling;
  var typeLayer = stage.nextSibling;

  // come nel riferimento: INDIETRO riporta all'ultima lista vista, home o indice
  Work.rememberEntry("home");

  /* la riga al centro: a ogni cambio di progetto si rimonta, cosi' le parole
     risalgono (nel riferimento e' un componente React con key nuova) */
  function renderType(i) {
    var p = P[i] || P[0];
    typeLayer.innerHTML =
      '<div class="col-row">' +
        '<span class="col-line col-name"><span style="--i:0">' + Work.esc(p.titolo) + "</span></span>" +
        '<span class="col-line col-kind"><span style="--i:1">' + Work.esc(p.tipo) + "</span></span>" +
        '<span class="col-line col-category"><span style="--i:2">' + Work.esc(p.categoria) + "</span></span>" +
        '<span class="col-line col-year"><span style="--i:3">' + Work.esc(p.anno) + "</span></span>" +
      "</div>";
  }
  renderType(0);

  Work.start("home");
  history.scrollRestoration = "manual";

  /* ---------- curve ---------- */

  var clamp = function (x, a, z) { return Math.max(a, Math.min(z, x)); };
  var lerp = function (a, z, t) { return a + (z - a) * t; };

  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    var X = function (t) { return ((ax * t + bx) * t + cx) * t; };
    var dX = function (t) { return (3 * ax * t + 2 * bx) * t + cx; };
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var k = 0; k < 8; k++) {
        var e = X(t) - x;
        if (Math.abs(e) < 1e-5) break;
        var d = dX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return ((ay * t + by) * t + cy) * t;
    };
  }
  var GLIDE = bezier(0.62, 0, 0.14, 1);
  var FADE = bezier(0.45, 0, 0.2, 1);
  var seg = function (t, start, dur, ease) { return ease(clamp((t - start) / dur, 0, 1)); };

  /* ---------- tempi dell'intro (secondi) ---------- */

  var T = (function () {
    var cruise = 1.3 / 3 + 0.45 + 0.75;
    var steps = Math.max(1, Math.round(1.9 * cruise));
    var end = 2.3 + 1.3 + 0.45 + 3;
    var gapAt = end - 1.5, uiAt = gapAt + 0.7;
    return { steps: steps, speed: steps / cruise, gapAt: gapAt, uiAt: uiAt, endAt: Math.max(end, uiAt + 1.5) };
  })();

  var gapP = function (t) { return seg(t, T.gapAt, 1.5, GLIDE); };
  var develop = function (t, o) { return seg(t, 0.15 + 0.065 * o, 1.05, GLIDE); };
  var fade = function (t, o) { return 1 - seg(t, 0.55 + 0.065 * o, 1.35, FADE); };
  var boxP = function (t, d) { return seg(t, T.uiAt + 0.1 * Math.min(d, 4), 1.5, GLIDE); };

  /* quanti item ha girato la colonna al tempo t: accelera per 1,3s,
     va dritta per 0,45s, frena per 3s (easeOutQuart). In tutto T.steps. */
  function spin(t) {
    var v = T.speed, r = t - 2.3;
    if (r <= 0) return 0;
    if (r < 1.3) { var x = r / 1.3; return (1.3 * v * x * x * x) / 3; }
    var s = (1.3 * v) / 3;
    if ((r -= 1.3) < 0.45) return s + v * r;
    var n = Math.min(1, (r -= 0.45) / 3);
    return s + 0.45 * v + ((3 * v) / 4) * (1 - Math.pow(1 - n, 4));
  }

  /* ---------- motore ---------- */

  var reduced = Work.reduced;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var A = Array.prototype.map.call(root.querySelectorAll("[data-item]"), function (el, i) {
    return {
      index: i,
      project: Number(el.dataset.project || 0),
      item: el,
      tile: el.querySelector("[data-tile]"),
      cover: el.querySelector("[data-cover]"),
      box: el.querySelector("[data-box]"),
      media: el.querySelector("[data-media]"),
      order: 0,
      shown: true,
      active: false,
    };
  });
  var q = A.length;

  // se l'intro parte lo decide lo script in <head> di index.html, prima del
  // primo disegno; qui si legge e basta
  var intro = !reduced && html.getAttribute("data-intro") === "running";

  html.setAttribute("data-intro", intro ? "running" : "skip");
  html.setAttribute("data-intro-live", "");
  root.setAttribute("data-engine", "pending");
  if (intro) stage.inert = true;

  var N = { vw: 0, vh: 0, width: 0, height: 0, pitch: 0, compact: false };
  var L = 0; // centro dello spacer

  function measure() {
    N.vw = html.clientWidth;
    N.vh = window.innerHeight;
    N.width = A[0].tile.offsetWidth;
    N.height = A[0].tile.offsetHeight;
    N.pitch = N.height + 12;
    N.compact = N.vw < 1200;
    root.style.setProperty("--centre", (N.vh / 2).toFixed(1) + "px");
    var h = Math.round(N.pitch * b * 240);
    spacer.style.height = h + "px";
    L = Math.round(h / 2);
  }

  function jump(y) {
    var l = window.__lenis;
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }

  // distanza di un item da una posizione, avvolta sul giro intero
  function wrap(i, at) {
    var r = (i - at) % q;
    if (r < -q / 2) r += q;
    if (r >= q / 2) r -= q;
    return r;
  }

  var P0 = 0, live = false, ui = false, activeIdx = -1, shownProject = -1, raf = 0;
  var C = 0, lastY = 0, still = 0;

  function goLive() {
    if (live) return;
    live = true;
    root.setAttribute("data-interactive", "");
    root.removeAttribute("data-developing");
    stage.inert = false;
    html.removeAttribute("data-scroll-lock");
    if (window.__lenis) window.__lenis.start();
    C = lastY = window.scrollY;
  }

  function setActive(m) {
    if (m === activeIdx) return;
    activeIdx = m;
    A.forEach(function (it) {
      var on = it.index === m;
      if (on === it.active) return;
      it.active = on;
      if (on) it.item.setAttribute("data-active", "");
      else it.item.removeAttribute("data-active");
      var v = it.media;
      if (v instanceof HTMLVideoElement && !reduced) {
        if (on) {
          v.muted = true;
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});
        } else v.pause();
      }
    });
    var pj = A[m].project;
    if (pj !== shownProject) {
      // la prima volta la riga c'e' gia': la fa salire data-ui
      if (shownProject !== -1) renderType(pj);
      shownProject = pj;
    }
  }

  function frame(t, settled) {
    var g = settled ? 1 : gapP(t);
    var grow = settled ? 0 : seg(t, 1.75, 2.3, GLIDE);
    var d = settled ? 1 : lerp(lerp(0.16, 0.875, grow), 1, g);
    var h = N.height * d;
    var y = h + 12 * g + (settled ? 0 : 14 * (1 - grow));
    var mid = N.vh / 2;
    var par = reduced ? 0 : N.compact ? 0.05 : 0.11;
    var at = live ? (window.scrollY - C) / N.pitch : T.steps - spin(t);
    var nearest = 0, best = Infinity;

    for (var k = 0; k < A.length; k++) {
      var it = A[k];
      var r = wrap(it.index, at);
      var n = mid + r * y;
      var dist = Math.abs(r);
      if (dist < best) { best = dist; nearest = it.index; }

      var vis = n + h / 2 > -60 && n - h / 2 < N.vh + 60;
      if (vis !== it.shown) { it.item.style.visibility = vis ? "" : "hidden"; it.shown = vis; }
      if (!vis) continue;

      it.item.style.transform = "translate3d(0, " + (n - N.height / 2).toFixed(2) + "px, 0)";
      it.tile.style.transform = d === 1 ? "" : "scale(" + d.toFixed(4) + ")";

      var s = settled ? 1 : develop(t, it.order);
      it.tile.style.clipPath = s >= 1 ? "" : "inset(" + ((1 - s) * 100).toFixed(2) + "% 0 0 0)";

      if (it.cover) {
        var f = settled ? 0 : fade(t, it.order);
        it.cover.style.opacity = f > 0.001 ? (1 - f).toFixed(3) : "";
        it.cover.style.filter = f > 0.01 ? "blur(" + (5 * f).toFixed(2) + "px)" : "";
        var py = (clamp((N.vh - (n - h / 2)) / (N.vh + h), 0, 1) - 0.5) * 2 * N.height * par;
        var sc = 1 + 0.18 * (1 - s);
        it.cover.style.transform = "translate3d(0, " + py.toFixed(2) + "px, 0)" + (sc > 1.001 ? " scale(" + sc.toFixed(4) + ")" : "");
      }

      if (it.box) {
        var bp = settled ? 1 : boxP(t, dist);
        it.box.style.clipPath = bp >= 1 ? "" : "inset(" + ((1 - bp) * 100).toFixed(2) + "% 0 0 0)";
        it.box.style.visibility = bp <= 0 ? "hidden" : "";
      }

      var v = it.media;
      if (v instanceof HTMLVideoElement && !reduced && !v.src && dist < 1.5 && (settled || t >= T.uiAt) && v.dataset.src) {
        v.src = v.dataset.src;
      }
    }

    if (settled || t >= T.uiAt) {
      if (!ui) {
        ui = true;
        root.setAttribute("data-ui", "");
        html.removeAttribute("data-intro");
        window.dispatchEvent(new Event(Work.INTRO_DONE));
      }
      setActive(nearest);
    }
  }

  function loop(now) {
    var t = (now - P0) / 1000;
    if (!live && t >= T.endAt) goLive();
    if (live) {
      var sy = window.scrollY;
      if (sy !== lastY) { lastY = sy; still = now; }
      else if (now - still > 400 && Math.abs(sy - L) > 0.8 * L) {
        var lap = N.pitch * b;
        var off = Math.round((sy - L) / lap) * lap;
        jump(sy - off);
        C -= off;
        lastY = window.scrollY;
      }
    }
    frame(live ? T.endAt : t, live);
    raf = requestAnimationFrame(loop);
  }

  // un'immagine o un video segnala quando e' pronto: solo allora la media
  // attiva sfuma sopra il tile
  A.forEach(function (it) {
    [it.media, it.item.querySelector("[data-poster]")].forEach(function (el) {
      if (!el) return;
      var ready = function () { el.setAttribute("data-ready", ""); };
      if (el instanceof HTMLVideoElement) el.addEventListener("playing", ready);
      else if (el.complete && el.naturalWidth > 0) ready();
      else el.addEventListener("load", ready);
    });
  });

  measure();
  var rows = Math.ceil(N.vh / 2 / (0.16 * N.height + 14));
  A.forEach(function (it) {
    it.order = clamp(rows - Math.round(wrap(it.index, T.steps)), 0, 2 * rows);
  });

  if (intro) root.setAttribute("data-developing", "");
  html.setAttribute("data-scroll-lock", "");
  if (window.__lenis) window.__lenis.stop();

  function begin() {
    jump(L);
    if (intro) P0 = performance.now() + 150;
    else { P0 = performance.now() - T.endAt * 1000; goLive(); }
    C = L;
    lastY = L;
    frame(intro ? -1 : T.endAt, !intro);
    root.setAttribute("data-engine", "on");
    raf = requestAnimationFrame(loop);
  }

  if (intro) {
    var timeout;
    Promise.race([
      Promise.all(A.filter(function (it) { return it.index < b; }).map(function (it) {
        var img = it.cover;
        return img && typeof img.decode === "function" ? img.decode().catch(function () {}) : Promise.resolve();
      })),
      new Promise(function (res) { timeout = setTimeout(res, 4000); }),
    ]).then(function () { clearTimeout(timeout); begin(); });
  } else {
    requestAnimationFrame(begin);
  }

  // ricalcola solo se cambia davvero la larghezza, o l'altezza di parecchio
  // (sul telefono la barra dell'indirizzo che compare non conta)
  var rt = 0;
  window.addEventListener("resize", function () {
    if (html.clientWidth === N.vw && (coarse || Math.abs(window.innerHeight - N.vh) < 80)) return;
    clearTimeout(rt);
    rt = setTimeout(function () {
      var pos = live ? (window.scrollY - C) / N.pitch : 0;
      measure();
      if (live) { C = L; jump(L + pos * N.pitch); lastY = window.scrollY; }
    }, 120);
  });

  // tornando con il tasto indietro la pagina puo' arrivare dalla cache:
  // il motore e' ancora vivo, basta ripulire lo stato delle transizioni
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) html.removeAttribute("data-page-exit");
  });
})();
