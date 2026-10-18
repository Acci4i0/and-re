/* Apertura delle cartelle "info" e "foto": si uniscono i puntini scrivendo la
   parola, poi si apre la pagina.

   Il disegno viene da INFO_Dot-to-Dot.html — stesso tratto tremolante, stesse
   sbavature oltre il punto quando la linea sta per girare, stesse soste negli
   angoli. Qui il motore e' generico e la parola e' un dato: la geometria dei
   puntini, il percorso della matita, e un paio di numeri che cambiano il modo
   in cui la mano si muove.

   Le due parole NON devono sembrare la stessa animazione con lettere diverse.
   Divergono su tre piani:
     - la mano: foto va un po' piu' piano e trema un po' di piu' di info;
     - il seme: cambia a ogni apertura, quindi nemmeno due info sono uguali;
     - il percorso: F e O sono condivise con info ma vengono raggiunte in un
       ordine diverso, e la T non esiste in info.

   Il link resta un <a href> vero: senza JavaScript, o con
   prefers-reduced-motion, il clic porta direttamente alla pagina. */

(function () {
  "use strict";

  var W = 960, H = 380;
  var PAPER = "#ffffff", INK = "#1e1f1c";

  /* ===================== le due parole ===================== */

  /* I puntini sono numerati nell'ordine in cui la linea li raggiunge la prima
     volta, come in un vero unisci-i-puntini. Nel percorso un indice ripetuto
     significa ripassare sopra al tratto gia' fatto: e' il modo in cui una
     lettera come la F si chiude senza staccare la matita. */

  var PAROLE = {
    info: {
      // velocita': l'originale impiega ~14,7s, a 3,5 il disegno dura ~4,2s
      velocita: 3.5,
      tremore: 1,
      punti: [
        [80, 92],   [142, 90],  [78, 290],  [144, 292],              // I
        [202, 288], [198, 92],  [328, 292], [334, 90],               // N
        [424, 292], [418, 190], [420, 94],  [548, 90],  [512, 194],  // F
        [614, 190], [642, 112], [704, 86],  [770, 110], [800, 192],  // O
        [772, 270], [706, 296], [640, 272]
      ],
      // svolte senza puntino: la mano gira a meta' delle grazie della I
      fantasmi: { "-1": [111, 94], "-2": [111, 289] },
      percorso: [0, 1, -1, -2, 2, 3, 4, 5, 6, 7, 6, 8, 9, 10, 11, 10, 9, 12,
                 13, 14, 15, 16, 17, 18, 19, 20, 13],
      // i puntini della O: fra loro il tratto si inarca invece di andare dritto
      tondi: [13, 14, 15, 16, 17, 18, 19, 20],
      centro: function () { return [707, 191]; },
      href: null   // riempito sotto dal link della cartella
    },

    foto: {
      // Parola piu' larga e con cinque puntini in piu': a 3,8 il disegno dura
      // ~4,5s contro i ~4,2 di info. Resta leggermente piu' lunga, perche' lo
      // e' la parola, ma non trascina — e dietro c'e' una galleria 3D che deve
      // anche caricarsi.
      velocita: 3.8,
      // Un filo piu' mossa: e' la stessa mano in un momento diverso, non un
      // plotter che ripete il compito.
      tremore: 1.15,
      punti: [
        [86, 292],  [80, 190],  [82, 94],   [210, 90],  [174, 194],  // F  0-4
        [260, 190], [288, 112], [350, 86],  [416, 110], [446, 192],  // O  5-9
        [418, 270], [352, 296], [286, 272],                          // O  10-12
        [561, 292], [563, 190], [561, 90],  [496, 92],  [626, 88],   // T  13-17
        [676, 190], [704, 112], [766, 86],  [832, 110], [862, 192],  // O  18-22
        [834, 270], [768, 296], [702, 272]                           // O  23-25
      ],
      fantasmi: {},
      /* F: su per l'asta, la barra alta, si ripassa indietro fino a meta' e si
            fa la barra di mezzo.
         O: giro completo, poi si ripassa la meta' bassa per uscire a destra —
            senza, per raggiungere la T la linea taglierebbe dentro la O.
         T: su per l'asta, barra verso sinistra, ritorno al centro e via a
            destra — cosi' si esce dal braccio destro, vicino alla O che
            segue. Uscendo dal piede dell'asta, il tratto di collegamento
            sembrava una gamba della T.
         O: giro completo, ultima lettera, si chiude dov'era partita. */
      percorso: [0, 1, 2, 3, 2, 1, 4,
                 5, 6, 7, 8, 9, 10, 11, 12, 5, 12, 11, 10, 9,
                 13, 14, 15, 16, 15, 17,
                 18, 19, 20, 21, 22, 23, 24, 25, 18],
      tondi: [5, 6, 7, 8, 9, 10, 11, 12, 18, 19, 20, 21, 22, 23, 24, 25],
      // due O, due centri: l'inarcamento va calcolato su quella giusta
      centro: function (i) { return i <= 12 ? [353, 191] : [769, 191]; },
      href: null
    }
  };

  /* ===================== caso ripetibile ===================== */

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

  /* ===================== costruzione del tratto ===================== */

  function costruisci(parola, seme) {
    s = seme;
    var D = parola.punti, ROUTE = parola.percorso, GHOST = parola.fantasmi;
    var TONDO = {};
    parola.tondi.forEach(function (i) { TONDO[i] = 1; });

    var n1 = makeNoise(), n2 = makeNoise(), n3 = makeNoise();

    // la mano atterra vicino al punto, quasi mai sopra
    var touch = ROUTE.map(function (i) {
      return i < 0 ? [GHOST[i][0] + rr(-3, 3), GHOST[i][1] + rr(-3, 3)]
                   : [D[i][0] + rr(-4.5, 4.5), D[i][1] + rr(-4.5, 4.5)];
    });

    var raw = [], segEnds = [];
    var S = [touch[0][0] + rr(-3, 3), touch[0][1] - rr(4, 10)];
    var prevDir = [0, 1];

    for (var k = 1; k < touch.length; k++) {
      var T = touch[k];
      var dx = T[0] - S[0], dy = T[1] - S[1];
      var len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      var nxt = touch[k + 1];
      var tondo = TONDO[ROUTE[k]] && TONDO[ROUTE[k - 1]];
      var os = tondo ? rr(0, 2) : rr(1, 5);
      if (nxt) {
        var nx = nxt[0] - T[0], ny = nxt[1] - T[1], nl = Math.hypot(nx, ny) || 1;
        var turn = 1 - (dx * nx + dy * ny) / nl;   // 0 dritto … 2 inversione
        os += turn * (tondo ? rr(0, 1.5) : rr(2.5, 6));
      } else os = rr(8, 14);
      os *= Math.min(1, len / 90);
      var E = [T[0] + dx * os + rr(-2, 2), T[1] + dy * os + rr(-2, 2)];

      var bow = rr(-0.05, 0.05) * len;
      if (tondo) {
        var c = parola.centro(ROUTE[k]);
        var mx = (S[0] + E[0]) / 2 - c[0], my = (S[1] + E[1]) / 2 - c[1];
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
    var pts = [], acc = 0, arc = [0];
    for (var i = 1; i < raw.length; i++)
      arc.push(acc += Math.hypot(raw[i][0] - raw[i-1][0], raw[i][1] - raw[i-1][1]));
    for (i = 0; i < raw.length; i++) {
      var a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      var off = (n1(arc[i] / 90) * 1.5 + n2(arc[i] / 14) * 0.45) * parola.tremore;
      pts.push({ x: raw[i][0] - ty * off, y: raw[i][1] + tx * off,
                 w: 1.45 + n3(arc[i] / 40) * 0.4, s: arc[i] });
    }

    // ogni segmento rallenta entrando nell'angolo, poi una breve sosta
    var timeline = [], t0 = 260 / parola.velocita, inizio = 0;
    segEnds.forEach(function (fine) {
      var lung = pts[fine].s - pts[inizio].s;
      var dur = (140 + lung / 0.36) / parola.velocita;
      timeline.push({ t0: t0, dur: dur, a: inizio, b: fine });
      t0 += dur + rr(40, 140) / parola.velocita;
      inizio = fine;
    });

    return { pts: pts, timeline: timeline, durata: t0 };
  }

  /* ===================== messa in scena ===================== */

  var velo = document.getElementById("apertura");
  var cv = velo && document.getElementById("apertura-canvas");
  if (!velo || !cv) return;

  var ctx = cv.getContext("2d");
  var ridotto = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* La parola resta ferma mezzo secondo prima di andarsene. Senza questa
     pausa l'ultima O si chiudeva e la pagina cambiava nello stesso istante:
     la parola non si faceva in tempo a leggere, e il disegno sembrava un
     effetto di passaggio invece che qualcosa da guardare. */
  var ATTESA_FINE = 550;
  var LAMPO = 110;        // il bianco che copre il cambio pagina
  var inCorso = false;
  var scala = 1;

  function ridimensiona() {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.width * H / W * dpr);
    scala = cv.width / W;
  }

  function puntini(D) {
    ctx.fillStyle = INK;
    ctx.font = '500 13px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textBaseline = "alphabetic";
    D.forEach(function (p, i) {
      ctx.beginPath(); ctx.arc(p[0], p[1], 4.6, 0, Math.PI * 2); ctx.fill();
      var n = String(i + 1);
      ctx.fillText(n.length < 2 ? "0" + n : n, p[0] - 23, p[1] - 9);
    });
  }

  function tratto(pts, fino, frazione) {
    if (fino < 1) return;
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(30,31,28,.7)"; ctx.shadowBlur = 1.05 * scala;
    var RUN = 5;   // tratti corti: lo spessore respira come la grafite
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

  function testaA(disegno, t) {
    var tl = disegno.timeline, pts = disegno.pts;
    if (t <= tl[0].t0) return [0, 0];
    for (var i = 0; i < tl.length; i++) {
      var seg = tl[i];
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

  function avvia(parola) {
    if (inCorso) return;
    inCorso = true;

    /* La pagina comincia a scaricarsi mentre si disegna: quando il lampo
       finisce e' gia' pronta, ed e' questo a far sembrare il passaggio
       immediato invece che una seconda attesa. */
    var pre = document.createElement("link");
    pre.rel = "prefetch";
    pre.href = parola.href;
    document.head.appendChild(pre);

    velo.hidden = false;
    velo.setAttribute("aria-hidden", "false");
    ridimensiona();

    var disegno = costruisci(parola, Math.floor(Math.random() * 100000) + 1);
    var inizio = null;

    requestAnimationFrame(function passo(ora) {
      if (inizio === null) inizio = ora;
      var t = ora - inizio;

      ctx.setTransform(scala, 0, 0, scala, 0, 0);
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
      puntini(parola.punti);

      var p = testaA(disegno, t), idx = p[0], frazione = p[1];
      tratto(disegno.pts, idx, frazione);

      var a = disegno.pts[Math.max(0, idx - 1)], b = disegno.pts[idx];
      matita(a.x + (b.x - a.x) * frazione, a.y + (b.y - a.y) * frazione,
             t > disegno.durata - 300 ? Math.max(0, 1 - (t - disegno.durata + 300) / 300)
                                      : Math.min(1, t / 160));

      if (t < disegno.durata + ATTESA_FINE) {
        requestAnimationFrame(passo);
      } else {
        velo.classList.add("apertura--lampo");
        setTimeout(function () { window.location.href = parola.href; }, LAMPO);
      }
    });
  }

  /* ===================== cablaggio delle cartelle ===================== */

  [["info-folder", "info"], ["foto-folder", "foto"]].forEach(function (coppia) {
    var link = document.getElementById(coppia[0]);
    var parola = PAROLE[coppia[1]];
    if (!link) return;
    parola.href = link.href;

    /* Non scatta dopo un trascinamento, perche' main.js in quel caso chiama
       preventDefault — stessa guardia della finestra dell'immagine. */
    link.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      if (ridotto.matches) return;        // il link fa il suo lavoro da solo
      e.preventDefault();
      avvia(parola);
    });
  });

  window.addEventListener("resize", function () { if (inCorso) ridimensiona(); });

  /* Tornando indietro il browser puo' ripescare questa pagina dalla sua
     memoria e rimetterla com'era: col velo aperto, cioe' una pagina bianca.
     Qui viene richiuso e lo stato azzerato, cosi' la cartella torna anche
     cliccabile una seconda volta. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    inCorso = false;
    velo.hidden = true;
    velo.setAttribute("aria-hidden", "true");
    velo.classList.remove("apertura--lampo");
  });
})();
