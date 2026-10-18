// Generatore di layout del cruciverba — fonte UNICA dell'algoritmo (prima
// duplicato in tools/generate-portrait.js e tools/generate-landscape.js).
//
// Deterministico ed esaustivo: a parita di parole produce sempre lo stesso
// layout (ricerca backtracking che tiene il migliore secondo il punteggio
// dell'orientamento). Espone due globali: generateLayout() e validateLayout().
//
// generateLayout(words, "portrait" | "landscape")
//   words: [{ number, answer }]  (answer in MAIUSCOLO, solo A-Z)
//   -> { cols, rows, words: [{ number, answer, direction, col, row }] }  oppure null

const CrosswordGenerator = (() => {
  // Le parole lunghe vengono forzate sull'asse dominante dell'orientamento
  // (verticali in portrait, orizzontali in landscape) per sfruttare lo spazio.
  const LONG_WORD_LENGTH = 7;

  // Rete di sicurezza: se la ricerca esplode (set di parole ostico), ci si
  // ferma sul miglior layout trovato finora invece di bloccare il browser.
  const MAX_STATES = 200000;

  const ORIENTATIONS = {
    // Portrait (mobile): stretto e alto. Penalizza il largo e minimizza l'altezza.
    portrait: {
      firstDirection: "down",
      longWordDirection: "down",
      maxWidth: 10,
      maxHeight: 16,
      score: ({ width, height }) => (width > height ? 1000 : 0) + height * 100 + width,
    },
    // Landscape (desktop/tablet): largo e basso. Penalizza l'alto e minimizza l'area.
    landscape: {
      firstDirection: "across",
      longWordDirection: "across",
      maxWidth: 19,
      maxHeight: 8,
      score: ({ width, height }) => (height >= width ? 1000 : 0) + height * 50 + width * height,
    },
  };

  function generateLayout(words, orientationName) {
    const orientation = ORIENTATIONS[orientationName];
    if (!orientation) throw new Error(`Orientamento sconosciuto: ${orientationName}`);

    const prepared = prepareWords(words, orientation);
    const best = searchBestLayout(prepared, orientation);
    if (!best) return null;

    const layout = normalize(best);
    if (validate(layout).length > 0) return null;
    const { width, height } = boundingBox(layout);
    return { cols: width, rows: height, words: layout };
  }

  // Forza le parole lunghe sull'asse dominante; le altre restano libere.
  function prepareWords(words, orientation) {
    return words.map((word) => ({
      number: word.number,
      answer: word.answer,
      forcedDirection:
        word.answer.length >= LONG_WORD_LENGTH ? orientation.longWordDirection : undefined,
    }));
  }

  function searchBestLayout(words, orientation) {
    const order = [...words].sort((a, b) => b.answer.length - a.answer.length);
    let best = null;
    let bestScore = Infinity;
    const seenStates = new Set();
    const indexByNumber = new Map(words.map((w, i) => [w.number, i]));

    // Griglia mantenuta incrementalmente lungo la ricorsione (con undo al
    // backtrack): permette di controllare un piazzamento in O(lunghezza
    // parola) invece di rivalidare l'intero layout a ogni candidato.
    const lettersByCell = new Map(); // chiave numerica -> lettera
    const wordsByCell = new Map(); // chiave numerica -> array di numeri di parola
    const startCells = new Set(); // celle iniziali delle parole piazzate
    let minCol = 0;
    let maxCol = 0;
    let minRow = 0;
    let maxRow = 0;

    const first = order[0];
    const firstDirection = first.forcedDirection || orientation.firstDirection;
    const firstPlacement = { ...first, direction: firstDirection, col: 0, row: 0 };
    place(firstPlacement);
    extend(order.slice(1), [firstPlacement]);
    return best;

    // A ogni passo prova qualunque parola rimanente: l'ordine di piazzamento
    // conta (una parola forzata orizzontale ha bisogno di una verticale gia
    // piazzata da incrociare), quindi non si segue un ordine fisso.
    function extend(remaining, placed) {
      if (seenStates.size > MAX_STATES) return; // rete di sicurezza
      if (remaining.length === 0) {
        const score = orientation.score({
          width: maxCol - minCol + 1,
          height: maxRow - minRow + 1,
        });
        if (score < bestScore) {
          bestScore = score;
          best = placed.map((p) => ({ ...p }));
        }
        return;
      }
      // Chiave dello stato a meno di traslazioni: evita di riesplorare lo
      // stesso insieme di piazzamenti raggiunto da un ordine diverso. Ogni
      // piazzamento diventa un intero (indice parola, direzione, posizione
      // relativa agli estremi — sempre < 256 con le dimensioni massime degli
      // orientamenti) e l'insieme ordinato una stringa compatta.
      const codes = [];
      for (const p of placed) {
        codes.push(
          (indexByNumber.get(p.number) << 17) |
            ((p.direction === "down" ? 1 : 0) << 16) |
            ((p.col - minCol) << 8) |
            (p.row - minRow)
        );
      }
      codes.sort(byValue);
      const chars = [];
      for (const v of codes) chars.push(v >>> 16, v & 0xffff);
      const state = String.fromCharCode.apply(null, chars);
      if (seenStates.has(state)) return;
      seenStates.add(state);

      for (const word of remaining) {
        const rest = remaining.filter((w) => w !== word);
        const candidates = crossingCandidates(word, placed);
        for (let c = 0; c < candidates.length; c += 3) {
          const direction = candidates[c] === 0 ? "across" : "down";
          const col = candidates[c + 1];
          const row = candidates[c + 2];
          if (!fits(word.answer.length, direction, col, row)) continue;
          if (!lettersCompatible(word.answer, direction, col, row)) continue;
          const placement = { ...word, direction, col, row };
          const undo = place(placement);
          if (adjacencyValid(placement)) extend(rest, [...placed, placement]);
          undo();
        }
      }
    }

    // Bounding box della griglia se si aggiungesse la parola, senza piazzarla.
    function fits(length, direction, col, row) {
      const endCol = direction === "across" ? col + length - 1 : col;
      const endRow = direction === "down" ? row + length - 1 : row;
      const width = Math.max(maxCol, endCol) - Math.min(minCol, col) + 1;
      const height = Math.max(maxRow, endRow) - Math.min(minRow, row) + 1;
      return width <= orientation.maxWidth && height <= orientation.maxHeight;
    }

    // Lettere coerenti su ogni cella gia occupata, e niente due parole che
    // partono dalla stessa cella (numerini sovrapposti).
    function lettersCompatible(answer, direction, col, row) {
      let key = cellNum(col, row);
      if (startCells.has(key)) return false;
      const step = direction === "across" ? STRIDE : 1;
      for (let i = 0; i < answer.length; i++, key += step) {
        const existing = lettersByCell.get(key);
        if (existing !== undefined && existing !== answer[i]) return false;
      }
      return true;
    }

    // Due celle ortogonalmente adiacenti sono lecite solo se condividono una
    // parola: basta controllare gli intorni delle celle appena piazzate.
    function adjacencyValid(word) {
      const step = word.direction === "across" ? STRIDE : 1;
      let key = cellNum(word.col, word.row);
      for (let i = 0; i < word.answer.length; i++, key += step) {
        const here = wordsByCell.get(key);
        for (const delta of NEIGHBOR_DELTAS) {
          const neighbor = wordsByCell.get(key + delta);
          if (!neighbor) continue;
          if (!here.some((n) => neighbor.includes(n))) return false;
        }
      }
      return true;
    }

    // Scrive la parola nella griglia e restituisce la funzione di undo.
    function place(word) {
      const savedMinCol = minCol;
      const savedMaxCol = maxCol;
      const savedMinRow = minRow;
      const savedMaxRow = maxRow;
      const step = word.direction === "across" ? STRIDE : 1;
      const length = word.answer.length;
      minCol = Math.min(minCol, word.col);
      maxCol = Math.max(maxCol, word.direction === "across" ? word.col + length - 1 : word.col);
      minRow = Math.min(minRow, word.row);
      maxRow = Math.max(maxRow, word.direction === "down" ? word.row + length - 1 : word.row);

      const startKey = cellNum(word.col, word.row);
      startCells.add(startKey);
      let newLetterMask = 0; // bit i acceso = la cella i-esima era vuota
      let key = startKey;
      for (let i = 0; i < length; i++, key += step) {
        if (!lettersByCell.has(key)) {
          lettersByCell.set(key, word.answer[i]);
          newLetterMask |= 1 << i;
        }
        let numbers = wordsByCell.get(key);
        if (!numbers) wordsByCell.set(key, (numbers = []));
        numbers.push(word.number);
      }

      return function undo() {
        minCol = savedMinCol;
        maxCol = savedMaxCol;
        minRow = savedMinRow;
        maxRow = savedMaxRow;
        startCells.delete(startKey);
        let key = startKey;
        for (let i = 0; i < length; i++, key += step) {
          if (newLetterMask & (1 << i)) lettersByCell.delete(key);
          const numbers = wordsByCell.get(key);
          numbers.pop();
          if (numbers.length === 0) wordsByCell.delete(key);
        }
      };
    }
  }

  // Chiave numerica compatta di una cella per le mappe della ricerca: una
  // parola "across" avanza di STRIDE, una "down" di 1. OFFSET tiene positive
  // le coordinate negative (le parole si piazzano attorno all'origine).
  const STRIDE = 256;
  const OFFSET = 64;
  const NEIGHBOR_DELTAS = [STRIDE, -STRIDE, 1, -1];

  function cellNum(col, row) {
    return (col + OFFSET) * STRIDE + (row + OFFSET);
  }

  function byValue(a, b) {
    return a - b;
  }

  // Tutte le posizioni in cui `word` incrocia una parola gia piazzata, come
  // triple piatte [direzione (0 = across, 1 = down), col, row, ...] per non
  // allocare un oggetto per candidato nel ciclo caldo della ricerca.
  function crossingCandidates(word, placed) {
    const candidates = [];
    const directions = word.forcedDirection ? [word.forcedDirection] : ["across", "down"];
    for (const direction of directions) {
      const flag = direction === "across" ? 0 : 1;
      for (const other of placed) {
        if (other.direction === direction) continue;
        for (let i = 0; i < word.answer.length; i++) {
          for (let j = 0; j < other.answer.length; j++) {
            if (word.answer[i] !== other.answer[j]) continue;
            const crossCol = other.direction === "across" ? other.col + j : other.col;
            const crossRow = other.direction === "down" ? other.row + j : other.row;
            candidates.push(
              flag,
              direction === "across" ? crossCol - i : crossCol,
              direction === "down" ? crossRow - i : crossRow
            );
          }
        }
      }
    }
    return candidates;
  }

  function boundingBox(placed) {
    const cells = placed.flatMap(wordCells);
    const cols = cells.map((c) => c.col);
    const rows = cells.map((c) => c.row);
    return {
      minCol: Math.min(...cols),
      minRow: Math.min(...rows),
      width: Math.max(...cols) - Math.min(...cols) + 1,
      height: Math.max(...rows) - Math.min(...rows) + 1,
    };
  }

  function normalize(placed) {
    const { minCol, minRow } = boundingBox(placed);
    return placed.map((p) => ({ ...p, col: p.col - minCol, row: p.row - minRow }));
  }

  // Vincoli: lettere coerenti negli incroci, ogni parola incrocia, niente due
  // parole dalla stessa cella, niente adiacenze fuori incrocio, griglia connessa.
  function validate(words) {
    const problems = [];
    const lettersByCell = new Map();
    const wordsByCell = new Map();

    for (const word of words) {
      for (let i = 0; i < word.answer.length; i++) {
        const key = cellKey(cellAt(word, i));
        const existing = lettersByCell.get(key);
        if (existing !== undefined && existing !== word.answer[i]) {
          problems.push(`conflitto di lettere in ${key}`);
        }
        lettersByCell.set(key, word.answer[i]);
        if (!wordsByCell.has(key)) wordsByCell.set(key, new Set());
        wordsByCell.get(key).add(word.number);
      }
    }

    const startKeys = words.map((w) => cellKey({ col: w.col, row: w.row }));
    if (new Set(startKeys).size !== startKeys.length) {
      problems.push("due parole partono dalla stessa cella (numerini sovrapposti)");
    }

    for (const word of words) {
      const crossesAnother = wordCells(word).some(
        (cell) => wordsByCell.get(cellKey(cell)).size > 1
      );
      if (!crossesAnother) problems.push(`la parola ${word.answer} non incrocia nessuno`);
    }

    for (const key of wordsByCell.keys()) {
      const [col, row] = key.split(",").map(Number);
      for (const [dc, dr] of [[1, 0], [0, 1]]) {
        const neighborKey = cellKey({ col: col + dc, row: row + dr });
        if (!wordsByCell.has(neighborKey)) continue;
        const shared = [...wordsByCell.get(key)].some((n) =>
          wordsByCell.get(neighborKey).has(n)
        );
        if (!shared) problems.push(`adiacenza non valida tra ${key} e ${neighborKey}`);
      }
    }

    if (!isConnected(words)) problems.push("griglia non connessa");
    return problems;
  }

  function isConnected(words) {
    const adjacency = new Map(words.map((w) => [w.number, new Set()]));
    const wordsByCell = new Map();
    for (const word of words) {
      for (const cell of wordCells(word)) {
        const key = cellKey(cell);
        if (!wordsByCell.has(key)) wordsByCell.set(key, []);
        wordsByCell.get(key).push(word.number);
      }
    }
    for (const numbers of wordsByCell.values()) {
      for (const a of numbers) for (const b of numbers) {
        if (a !== b) adjacency.get(a).add(b);
      }
    }
    const visited = new Set();
    const queue = [words[0].number];
    while (queue.length > 0) {
      const current = queue.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...adjacency.get(current));
    }
    return visited.size === words.length;
  }

  function wordCells(word) {
    return [...word.answer].map((_, i) => cellAt(word, i));
  }

  function cellAt(word, index) {
    return word.direction === "across"
      ? { col: word.col + index, row: word.row }
      : { col: word.col, row: word.row + index };
  }

  function cellKey({ col, row }) {
    return `${col},${row}`;
  }

  // Valida un layout gia generato ({ cols, rows, words }). Usato in dev da script.js.
  function validateLayout(layout) {
    return validate(layout.words);
  }

  return { generateLayout, validateLayout };
})();

const generateLayout = CrosswordGenerator.generateLayout;
const validateLayout = CrosswordGenerator.validateLayout;
