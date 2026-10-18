/* ============================================================================
 * Preloader col contatore — replica 1:1 di quello di 2Dgallery
 * (src/components/Preloader.js + timeline della home): step non lineari ogni
 * 100ms (0 -> 100 in 1.6s), il contatore resta su 100 per 1.7s e poi vola in
 * alto (translateY -150%, opacity 0, 1.3s, easing ≈ GSAP power3.inOut).
 * Vanilla + Web Animations API: nessuna dipendenza, identico nei progetti
 * che lo usano.
 * ========================================================================== */

const COUNTER_STEPS = [0, 7, 15, 21, 30, 38, 45, 55, 63, 73, 74, 80, 86, 91, 98, 99, 100];
const STEP_MS = 100;
const EXIT_DELAY_MS = 1700;
const EXIT_DURATION_MS = 1300;
// equivalente CSS di GSAP power3.inOut (easeInOutQuart)
const EXIT_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
// stack sans di default di Tailwind: il font del contatore in 2Dgallery
const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Mostra il preloader sopra la pagina. Lo sfondo copre tutto finché il
 * contatore non parte verso l'alto: da lì il contenuto si rivela sotto il
 * numero in volo, come in 2Dgallery. Con reveal: "exit-end" lo sfondo resta
 * coprente fino a fine volo (per pagine che montano il contenuto in ritardo).
 * Ritorna una Promise risolta all'inizio dell'uscita.
 */
export function showPreloader({ background = "#fff", color = "#000", reveal = "exit-start" } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      background,
      color,
      fontFamily: FONT_STACK,
    });

    // Markup del contatore come in 2Dgallery: fixed in alto, testo enorme
    // (text-7xl = 4.5rem), numero corrente a sinistra (8/12), "100" a destra.
    const counter = document.createElement("div");
    Object.assign(counter.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      display: "flex",
      paddingLeft: "0.25rem",
      fontSize: "4.5rem",
      lineHeight: "1",
      textTransform: "uppercase",
    });
    const current = document.createElement("div");
    current.style.width = "66.666667%";
    current.textContent = "0";
    const total = document.createElement("div");
    total.style.width = "33.333333%";
    total.textContent = "100";
    counter.append(current, total);
    overlay.appendChild(counter);
    document.body.appendChild(overlay);

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      if (index >= COUNTER_STEPS.length) {
        clearInterval(interval);
        return;
      }
      current.textContent = String(COUNTER_STEPS[index]);
    }, STEP_MS);

    setTimeout(() => {
      resolve();
      if (reveal === "exit-start") {
        overlay.style.background = "transparent";
      }
      overlay.style.pointerEvents = "none";
      const exit = counter.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: "translateY(-150%)", opacity: 0 },
        ],
        { duration: EXIT_DURATION_MS, easing: EXIT_EASING, fill: "forwards" },
      );
      const cleanup = () => overlay.remove();
      exit.finished.then(cleanup).catch(cleanup);
    }, EXIT_DELAY_MS);
  });
}
