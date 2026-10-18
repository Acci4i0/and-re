import { createRoot } from 'react-dom/client';
// Font del titolo dell'intro (self-hostato via Fontsource, licenza SIL OFL).
import '@fontsource/monoton';
import App from './App.jsx';
import { showPreloader } from './preloader.js';

// Preloader col contatore (stesso di 2Dgallery), bianco su nero come lo
// sfondo iniziale dell'intro; lo sfondo del preloader resta coprente fino a
// fine volo (reveal: exit-end), così non c'è nessun flash bianco prima del
// mount. L'app monta quando il contatore parte verso l'alto: l'intro
// tipografica comincia sotto il numero in volo senza perdersi nulla (le
// texture si precaricano comunque da subito, all'import di App).
showPreloader({ background: '#000000', color: '#ffffff', reveal: 'exit-end' }).then(() => {
  createRoot(document.getElementById('root')).render(<App />);
});
