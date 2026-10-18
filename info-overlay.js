/* Apertura della cartella "info": prima si scrive INFO unendo i puntini, poi
   parte il cruciverba.

   Il disegno e' quello di INFO_Dot-to-Dot.html — stessa geometria, stesso
   tratto tremolante, stesse sbavature oltre il punto quando la linea sta per
   girare. Cambiano tre cose:

     1. VELOCITA, che comprime tutti i tempi: la versione originale gira in
        una decina di secondi, qui deve stare dentro il tempo che uno accetta
        di aspettare prima di vedere la pagina che ha chiesto.
     2. non si ripete in ciclo: va dall'inizio alla fine una volta sola.
     3. finisce con un lampo e la navigazione, invece che in dissolvenza.

   Il link resta un <a href> vero: senza JavaScript, o con
   prefers-reduced-motion, si va al cruciverba e basta. */

(function () {
  "use strict";

  // L'originale impiega ~14,7s. A 7 la mano correva: il tratto arrivava prima
  // che l'occhio seguisse. A 3,5 il disegno dura ~4,2s e si vede la matita
  // rallentare negli angoli, che e' quello che lo fa sembrare una mano.
  var VELOCITA = 3.5;
  // Chiusa la O si passa subito: niente pausa di cortesia, il cruciverba e'
  // gia' scaricato e questa animazione E' il caricamento della pagina.
  var ATTESA_FINE = 90;
  var LAMPO = 110;

  var velo = document.getElementById("info-overlay");
  var cv = document.getElementById("info-canvas");
  var link = document.getElementById("info-folder");
  if (!velo || !cv || !link) return;

  var ctx = cv.getContext("2d");
  var ridotto = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ===== la geometria: INFO scritto in puntini ===== */

  var W = 960, H = 380;
  // Bianco come il resto del sito: il velo non deve sembrare un posto
  // diverso, solo la stessa pagina che si sta scrivendo addosso.
  var PAPER = "#ffffff", INK = "#1e1f1c";

  var D = [
    [80, 92],   [142, 90],  [78, 290],  [144, 292],
    [202, 288], [198, 92],  [328, 292], [334, 90],
    [424, 292], [418, 190], [420, 94],  [548, 90],  [512, 194],
    [614, 190], [642, 112], [704, 86],  [770, 110], [800, 192],
    [772, 270], [706, 296], [640, 272]
  ];
  var O_C = [707, 191];
  var ROUND = { 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1 };
  var GHOST = { "-1": [111, 94], "-2": [111, 289] };
  var ROUTE = [0, 1, -1, -2, 2, 3, 4, 5, 6, 7, 6, 8, 9, 10, 11, 10, 9, 12,
               13, 14, 15, 16, 17, 18, 19, 20, 13];

  /* ===== caso a caso ripetibile: stesso seme, stesso tratto ===== */

  var s = 1;
  function rnd() { return (s = (s * 16807) % 2147483647) / 2147483647; }
  function rr(a, b) { return a + rnd() * (b - a); }
  function makeNoise() {
    var g = [], i;
    for (i = 0; i < 512; i++) g.push(rnd() * 2 - 1);
    return function (x) {
      var k = Math.floor(x), f = x - k, u = f * f * (3 - 2 * f);
      return g[k & 511] * (1 - u) + g[(k + 1) & 511] * u;
    };
  }

  var pts, segEnds, timeline, DURATA;

  function costruisci(seme) {
    s = seme;
    var n1 = makeNoise(), n2 = makeNoise(), n3 = makeNoise();
    // la mano atterra vicino al punto, quasi mai sopra
    var touch = ROUTE.map(function (i) {
      return i < 0 ? [GHOST[i][0] + rr(-3, 3), GHOST[i][1] + rr(-3, 3)]
                   : [D[i][0] + rr(-4.5, 4.5), D[i][1] + rr(-4.5, 4.5)];
    });
    var raw = []; segEnds = [];
    var S = [touch[0][0] + rr(-3, 3), touch[0][1] - rr(4, 10)];
    var prevDir = [0, 1];

    for (var k = 1; k < touch.length; k++) {
      var T = touch[k];
      var dx = T[0] - S[0], dy = T[1] - S[1];
      var len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      var nxt = touch[k + 1];
      var round = ROUND[ROUTE[k]] && ROUND[ROUTE[k - 1]];
      var os = round ? rr(0, 2) : rr(1, 5);
      if (nxt) {
        var nx = nxt[0] - T[0], ny = nxt[1] - T[1], nl = Math.hypot(nx, ny) || 1;
        var turn = 1 - (dx * nx + dy * ny) / nl;   // 0 dritto … 2 inversione
        os += turn * (round ? rr(0, 1.5) : rr(2.5, 6));
      } else os = rr(8, 14);
      os *= Math.min(1, len / 90);
      var E = [T[0] + dx * os + rr(-2, 2), T[1] + dy * os + rr(-2, 2)];

      var bow = rr(-0.05, 0.05) * len;
      if (round) {
        var mx = (S[0] + E[0]) / 2 - O_C[0], my = (S[1] + E[1]) / 2 - O_C[1];
        bow = Math.sign(-dy * mx + dx * my || 1) * len * rr(0.12, 0.17);
      }
      var c1 = [S[0] + prevDir[0] * Math.min(11, len * 0.1) + dx * len * 0.22 - dy * bow,
                S[1] + prevDir[1] * Math.min(11, len * 0.1) + dy * len * 0.22 + dx * bow];
      var c2 = [E[0] - dx * len * 0.3 - dy * bow * rr(0.4, 1.2),
                E[1] - dy * len * 0.3 + dx * bow * rr(0.4, 1.2)];
      var steps = Math.max(12, Math.ceil(len / 2));
      for (var j = (k === 1 ? 0 : 1); j <= steps; j++) {
        var t = j / steps, u = 1 - t;
        raw.push([u*u*u*S[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*E[0],
                  u*u*u*S[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*E[1]]);
      }
      segEnds.push(raw.length - 1);
      var ex = E[0] - c2[0], ey = E[1] - c2[1], el = Math.hypot(ex, ey) || 1;
      prevDir = [ex / el, ey / el];
      S = E;
    }

    // tremolio perpendicolare al moto: deriva lenta piu' vibrazione fine
    pts = []; var acc = 0; var arc = [0];
    for (var i = 1; i < raw.length; i++)
      arc.push(acc += Math.hypot(raw[i][0] - raw[i-1][0], raw[i][1] - raw[i-1][1]));
    for (i = 0; i < raw.length; i++) {
      var a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      var off = n1(arc[i] / 90) * 1.5 + n2(arc[i] / 14) * 0.45;
      pts.push({ x: raw[i][0] - ty * off, y: raw[i][1] + tx * off,
                 w: 1.45 + n3(arc[i] / 40) * 0.4, s: arc[i] });
    }

    // tempi: ogni segmento rallenta entrando nell'angolo, poi una breve sosta.
    // Tutto diviso per VELOCITA: e' l'unico punto che cambia rispetto
    // all'originale, cosi' le proporzioni fra i tratti restano quelle.
    timeline = []; var t0 = 260 / VELOCITA, inizio = 0;
    segEnds.forEach(function (fine) {
      var lung = pts[fine].s - pts[inizio].s;
      var dur = (140 + lung / 0.36) / VELOCITA;
      timeline.push({ t0: t0, dur: dur, a: inizio, b: fine });
      t0 += dur + rr(40, 140) / VELOCITA;
      inizio = fine;
    });
    DURATA = t0;
  }

  /* ===== disegno ===== */

  var scala = 1;
  function ridimensiona() {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.width * H / W * dpr);
    scala = cv.width / W;
  }

  function puntini() {
    ctx.fillStyle = INK;
    ctx.font = '500 13px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textBaseline = "alphabetic";
    D.forEach(function (p, i) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(String(i + 1).length < 2 ? "0" + (i + 1) : String(i + 1), p[0] - 23, p[1] - 9);
    });
  }

  function tratto(fino, frazione) {
    if (fino < 1) return;
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(30,31,28,.7)"; ctx.shadowBlur = 1.05 * scala;
    // tratti corti: cosi' lo spessore respira come la pressione della grafite
    var RUN = 5;
    for (var i = 0; i < fino; i += RUN) {
      var j = Math.min(fino, i + RUN);
      ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y);
      for (var k = i + 1; k <= j; k++) {
        if (k === fino && frazione < 1) {
          var p = pts[k - 1], q = pts[k];
          ctx.lineTo(p.x + (q.x - p.x) * frazione, p.y + (q.y - p.y) * frazione);
        } else ctx.lineTo(pts[k].x, pts[k].y);
      }
      ctx.lineWidth = pts[i].w; ctx.stroke();
    }
    ctx.restore();
  }

  function matita(x, y, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(x, y); ctx.rotate(-0.9);
    ctx.lineWidth = 1.1; ctx.strokeStyle = INK; ctx.fillStyle = PAPER; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(5, -3.2); ctx.lineTo(28, -3.2);
    ctx.lineTo(28, 3.2); ctx.lineTo(5, 3.2); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -3.2); ctx.lineTo(5, 3.2);
    ctx.moveTo(24, -3.2); ctx.lineTo(24, 3.2); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(1.8, -1.15); ctx.lineTo(1.8, 1.15); ctx.fill();
    ctx.restore();
  }

  function easeSeg(x) { return x - Math.sin(2 * Math.PI * x) / (2 * Math.PI) * 0.55; }

  function testaA(t) {
    if (t <= timeline[0].t0) return [0, 0];
    for (var i = 0; i < timeline.length; i++) {
      var seg = timeline[i];
      if (t < seg.t0) return [seg.a, 0];                 // in sosta su un angolo
      if (t <= seg.t0 + seg.dur) {
        var e = easeSeg((t - seg.t0) / seg.dur);
        var bersaglio = pts[seg.a].s + (pts[seg.b].s - pts[seg.a].s) * e;
        var k = seg.a;
        while (k < seg.b && pts[k + 1].s < bersaglio) k++;
        var span = (pts[k + 1] ? pts[k + 1].s : bersaglio) - pts[k].s;
        return [k + 1, span > 0 ? (bersaglio - pts[k].s) / span : 1];
      }
    }
    return [pts.length - 1, 1];
  }

  /* ===== messa in scena ===== */

  var inCorso = false;

  function vai() {
    window.location.href = link.href;
  }

  function avvia() {
    if (inCorso) return;
    inCorso = true;

    // il cruciverba comincia a scaricarsi mentre si disegna: quando il lampo
    // finisce la pagina e' gia' pronta, ed e' questo a far sembrare il
    // passaggio immediato invece che una seconda attesa
    var pre = document.createElement("link");
    pre.rel = "prefetch";
    pre.href = link.href;
    document.head.appendChild(pre);

    velo.hidden = false;
    velo.setAttribute("aria-hidden", "false");
    ridimensiona();
    costruisci(Math.floor(Math.random() * 100000) + 1);

    var inizio = null;
    requestAnimationFrame(function passo(ora) {
      if (inizio === null) inizio = ora;
      var t = ora - inizio;

      ctx.setTransform(scala, 0, 0, scala, 0, 0);
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
      puntini();

      var p = testaA(t), idx = p[0], frazione = p[1];
      tratto(idx, frazione);

      var a = pts[Math.max(0, idx - 1)], b = pts[idx];
      matita(a.x + (b.x - a.x) * frazione, a.y + (b.y - a.y) * frazione,
             t > DURATA - 300 ? Math.max(0, 1 - (t - DURATA + 300) / 300)
                              : Math.min(1, t / 160));

      if (t < DURATA + ATTESA_FINE) {
        requestAnimationFrame(passo);
      } else {
        velo.classList.add("info-overlay--lampo");
        setTimeout(vai, LAMPO);
      }
    });
  }

  /* Il click: non scatta dopo un trascinamento, perche' main.js in quel caso
     chiama preventDefault — stessa guardia che usa gia' la finestra
     dell'immagine. Con prefers-reduced-motion si va dritti al cruciverba. */
  link.addEventListener("click", function (e) {
    if (e.defaultPrevented) return;
    if (ridotto.matches) return;          // il link fa il suo lavoro da solo
    e.preventDefault();
    avvia();
  });

  window.addEventListener("resize", function () { if (inCorso) ridimensiona(); });

  /* Tornando indietro dal cruciverba il browser puo' ripescare questa pagina
     dalla sua memoria (bfcache) e la rimette ESATTAMENTE com'era al momento
     in cui l'hai lasciata: con il velo bianco aperto. Risultato: premi la
     freccia indietro e trovi una pagina bianca invece della scrivania.

     Qui il velo viene richiuso e lo stato azzerato, cosi' la cartella info
     torna anche cliccabile una seconda volta. persisted distingue il
     ripristino dalla bfcache da un caricamento normale. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    inCorso = false;
    velo.hidden = true;
    velo.setAttribute("aria-hidden", "true");
    velo.classList.remove("info-overlay--lampo");
  });
})();
