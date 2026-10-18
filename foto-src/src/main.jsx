import { createRoot } from 'react-dom/client';
// Font del titolo dell'intro (self-hostato via Fontsource, licenza SIL OFL).
import '@fontsource/monoton';
import App from './App.jsx';

// L'app monta subito. Qui stava un contatore 0-100 che teneva la pagina ferma
// 4,6 secondi prima del mount: una seconda schermata di attesa dopo quella
// della home. Ad aprire la galleria e' l'animazione FOTO, che fa da
// caricamento — le texture si precaricano comunque dall'import di App.
createRoot(document.getElementById('root')).render(<App />);
