/* work — pezzi comuni a tutte le pagine:
     - nav e pannello About
     - scroll fluido (Lenis) solo con il mouse, come il riferimento
     - transizioni tra pagine
     - testo che sale, immagini che si svelano, parallax, video in vista

   Ogni pezzo e' la traduzione di un componente del riferimento: i numeri sono
   quelli, non approssimazioni. Vedi ANIMATION_SPEC.md. */

(function () {
  "use strict";

  var html = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = window.WORK;
  var ENTRY_KEY = "andre-work-entry";
  var INTRO_DONE = "work:intro-done";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* da dove si e' entrati in un progetto: decide dove porta INDIETRO */
  function rememberEntry(e) {
    try { sessionStorage.setItem(ENTRY_KEY, e); } catch (_) {}
  }
  function readEntry() {
    try { return sessionStorage.getItem(ENTRY_KEY) === "home" ? "home" : "archive"; } catch (_) { return "archive"; }
  }

  /* ============================ nav + About ============================ */

  function navItem(label, i, attrs) {
    return '<span class="mask"><span class="line" style="--i:' + i + '">' + label + "</span></span>";
  }

  function mountHeader(current) {
    var h = document.createElement("header");
    var links = W.contatti.map(function (c) {
      return '<li><a class="hit" href="' + esc(c.href) + '"' +
        (/^https?:/.test(c.href) ? ' target="_blank" rel="noreferrer"' : "") + ">" + esc(c.etichetta) + "</a></li>";
    }).join("");
    var insta = W.contatti[0];
    h.innerHTML =
      '<nav class="nav fixed-full" aria-label="Principale">' +
        '<div class="nav-row nav-top">' +
          '<a class="nav-item nav-wordmark hit" href="./"' + (current === "home" ? ' aria-current="page"' : "") + ">" + navItem(esc(W.nome), 0) + "</a>" +
          '<a class="nav-item hit" href="progetti.html"' + (current === "index" ? ' aria-current="page"' : "") + ">" + navItem("PROGETTI", 2) + "</a>" +
        "</div>" +
        '<div class="nav-row nav-bottom">' +
          '<button type="button" class="nav-item hit" aria-expanded="false" aria-controls="about" aria-haspopup="dialog">' + navItem("ABOUT", 3) + "</button>" +
          '<a class="nav-item hit" href="../">' + navItem("DESKTOP", 4) + "</a>" +
        "</div>" +
      "</nav>" +
      '<div id="about" class="panel fixed-full" role="dialog" aria-label="About" data-open="false" inert>' +
        '<div class="panel-scrim" aria-hidden="true"></div>' +
        '<div class="panel-layer"><div class="panel-content">' +
          '<p class="t-detail panel-text">' + esc(W.about) + "</p>" +
          '<ul class="panel-links">' + links + "</ul>" +
        "</div></div>" +
        '<div class="panel-footer"></div>' +
      "</div>";
    document.body.insertBefore(h, document.body.firstChild);

    // in basso a destra, da 810px in su (sotto e' nascosto dal CSS)
    if (insta) {
      var f = document.createElement("footer");
      f.className = "footer";
      f.innerHTML = '<a class="footer-link nav-item hit" href="' + esc(insta.href) + '" target="_blank" rel="noopener"><span class="mask">' +
        '<span class="line footer-line" style="--i:5"><span>' + esc(insta.etichetta) + "</span>" +
        '<svg class="footer-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" fill="none" stroke="currentColor"/></svg>' +
        "</span></span></a>";
      document.body.appendChild(f);
      footerGuard(f);
    }

    var btn = h.querySelector("button");
    var panel = h.querySelector(".panel");
    var open = false;

    function set(v) {
      if (v === open) return;
      open = v;
      panel.setAttribute("data-open", String(v));
      panel.inert = !v;
      btn.setAttribute("aria-expanded", String(v));
      if (v) {
        html.setAttribute("data-scroll-lock", "");
        if (window.__lenis) window.__lenis.stop();
      } else {
        if (panel.contains(document.activeElement)) btn.focus();
        // la home tiene il blocco durante la sua intro: non lo tolgo io
        if (!html.hasAttribute("data-intro")) html.removeAttribute("data-scroll-lock");
        if (window.__lenis) window.__lenis.start();
      }
    }
    btn.addEventListener("click", function () { set(!open); });
    panel.querySelector(".panel-scrim").addEventListener("click", function () { set(false); });
    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); set(false); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(h.querySelectorAll("a[href], button"), function (el) {
        return el.getClientRects().length > 0 && !el.closest("[inert]");
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = document.activeElement, inside = h.contains(a);
      if (e.shiftKey && (!inside || a === first)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || a === last)) { e.preventDefault(); first.focus(); }
    });
  }

  /* Il link fisso in basso a destra si dissolve quando ci passa sotto una
     didascalia o la barra del prossimo progetto: le due scritte, entrambe in
     basso a destra, si sovrapporrebbero (con lo schermo basso di un portatile
     succede spesso). Osservo solo la fascia alta 48px in fondo allo schermo. */
  function footerGuard(f) {
    if (!("IntersectionObserver" in window)) return;
    var under = new Set(), io = null;
    function watch() {
      if (io) io.disconnect();
      under.clear();
      f.classList.remove("footer--covered");
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) under.add(e.target); else under.delete(e.target); });
        f.classList.toggle("footer--covered", under.size > 0);
      }, { rootMargin: "-" + Math.max(0, window.innerHeight - 48) + "px 0px 0px 0px", threshold: 0 });
      document.querySelectorAll(".p-caption, .next-root, .i-head").forEach(function (el) { io.observe(el); });
    }
    requestAnimationFrame(watch);
    var t = 0;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(watch, 150); });
  }

  /* ============================ scroll fluido ============================ */

  function smoothScroll() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || reduced || typeof window.Lenis !== "function") return;
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ============================ transizioni ============================ */

  var instant = false;

  function transitions() {
    var capable = "onpagereveal" in window;
    if (capable) {
      // back/forward e ricarica: niente tendina, come nel riferimento
      var skip = function (e) {
        if (!e.viewTransition) return;
        if (instant) { e.viewTransition.skipTransition(); return; }
        var t = window.navigation && navigation.activation && navigation.activation.navigationType;
        var a = e.activation && e.activation.navigationType;
        if (reduced || a === "traverse" || a === "reload" || (!a && (t === "traverse" || t === "reload"))) {
          e.viewTransition.skipTransition();
        }
      };
      window.addEventListener("pageswap", skip);
      window.addEventListener("pagereveal", skip);
      return;
    }
    // senza View Transitions: dissolvenza di 0,25s, poi si naviga
    var timer = 0;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.indexOf(dir()) !== 0) return;
      if (u.pathname === location.pathname && u.search === location.search) return;
      if (reduced) return;
      e.preventDefault();
      go(u.href);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) html.removeAttribute("data-page-exit");
    });
    function dir() { return location.pathname.replace(/[^/]*$/, ""); }
    function go(href) {
      html.setAttribute("data-page-exit", "");
      clearTimeout(timer);
      timer = setTimeout(function () { location.href = href; }, 250);
    }
  }

  function navigate(href, opts) {
    if (opts && opts.instant) { instant = true; location.href = href; return; }
    if (!("onpagereveal" in window) && !reduced) {
      html.setAttribute("data-page-exit", "");
      setTimeout(function () { location.href = href; }, 250);
    } else {
      location.href = href;
    }
  }

  /* ============================ testo che sale ============================ */

  /* Spezza un testo in parole (o pezzi ai trattini) che salgono una riga alla
     volta. Il testo puo' contenere <a href="...">...</a>. */
  function riseWords(text, hyphens) {
    var out = "", last = 0, re = /<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, m;
    function words(s) {
      return s.split(/(\s+)/).map(function (w) {
        if (!w) return "";
        if (/^\s+$/.test(w)) return " ";
        var parts = hyphens ? (w.match(/[^-]+-*|-+/g) || [w]) : [w];
        return parts.map(function (p) { return '<span class="rise rise-piece">' + esc(p) + "</span>"; }).join("");
      }).join("");
    }
    while ((m = re.exec(text))) {
      out += words(text.slice(last, m.index));
      out += '<a href="' + esc(m[1]) + '">' + words(m[2]) + "</a>";
      last = m.index + m[0].length;
    }
    return out + words(text.slice(last));
  }

  /* assegna --rise-line misurando dove vanno a capo le parole */
  function measureRise(root) {
    var groups = (root || document).querySelectorAll("[data-rise-text]");
    Array.prototype.forEach.call(groups, function (g) {
      var pieces = g.querySelectorAll(".rise-piece");
      if (!pieces.length) return;
      var anim = pieces[0].getAnimations && pieces[0].getAnimations()[0];
      var delay = parseFloat(getComputedStyle(g).getPropertyValue("--rise-delay")) || 0;
      if (anim && Number(anim.currentTime) > delay * 1000) return;
      var line = -1, top = NaN;
      Array.prototype.forEach.call(pieces, function (p) {
        var t = p.offsetTop;
        if (!(Math.abs(t - top) < 2)) { line++; top = t; }
        p.style.setProperty("--rise-line", String(line));
      });
    });
  }

  function riseReady() {
    measureRise();
    html.setAttribute("data-rise-ready", "");
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(function () { measureRise(); });
  }

  /* ============================ immagini ============================ */

  var LEVEL = { 1: 0, 2: 0.12 };
  function maskReveal() {
    var seen = new WeakSet();
    function scan() {
      var n = 0;
      document.querySelectorAll("[data-mask-reveal]").forEach(function (el) {
        if (seen.has(el)) return;
        seen.add(el);
        var d = (LEVEL[el.getAttribute("data-mask-reveal") || "1"] || 0) + Math.min(0.07 * n, 0.35);
        n++;
        el.style.setProperty("--mask-delay", d.toFixed(3) + "s");
        requestAnimationFrame(function () { el.classList.add("mask-in"); });
      });
    }
    scan();
    window.addEventListener(INTRO_DONE, scan);
    window.addEventListener("pageshow", scan);
  }

  function imageParallax() {
    if (reduced) return;
    var live = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) live.add(e.target);
        else { live.delete(e.target); e.target.style.translate = "0px 0px"; }
      });
    }, { rootMargin: "25% 0px 25% 0px", threshold: 0 });
    document.querySelectorAll("[data-image-parallax]").forEach(function (el) { io.observe(el); });
    (function tick() {
      var vh = window.innerHeight;
      live.forEach(function (el) {
        var r = (el.closest("[data-parallax-frame]") || el.parentElement || el).getBoundingClientRect();
        if (!r.height) return;
        var y = (Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height))) - 0.5) * 2 * r.height * 0.025;
        el.style.translate = "0px " + y.toFixed(2) + "px";
      });
      requestAnimationFrame(tick);
    })();
  }

  function inViewVideos() {
    if (reduced) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0 });
    document.querySelectorAll("video[data-inview]").forEach(function (v) { v.muted = true; io.observe(v); });
  }

  /* un'immagine o un video del progetto, nel markup di una cornice */
  function mediaTag(m, cls, extra) {
    if (m.video) {
      return '<video class="' + cls + '" src="' + esc(m.video) + '"' + (m.poster ? ' poster="' + esc(m.poster) + '"' : "") +
        ' aria-label="' + esc(m.alt || "") + '" muted loop playsinline preload="metadata" disablepictureinpicture data-inview></video>';
    }
    return '<img class="' + cls + '" src="' + esc(m.src) + '" width="' + m.w + '" height="' + m.h + '" alt="' + esc(m.alt || "") +
      '" decoding="async" draggable="false"' + (extra || "") + ">";
  }

  function project(slug) {
    for (var i = 0; i < W.progetti.length; i++) if (W.progetti[i].slug === slug) return W.progetti[i];
    return null;
  }

  window.Work = {
    reduced: reduced,
    INTRO_DONE: INTRO_DONE,
    esc: esc,
    rememberEntry: rememberEntry,
    readEntry: readEntry,
    riseWords: riseWords,
    mediaTag: mediaTag,
    project: project,
    navigate: navigate,
    /* da chiamare quando il contenuto della pagina e' nel DOM */
    start: function (current) {
      mountHeader(current);
      smoothScroll();
      riseReady();
      maskReveal();
      imageParallax();
      inViewVideos();
    },
  };

  transitions();
})();
