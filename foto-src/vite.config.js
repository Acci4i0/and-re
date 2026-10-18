import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Path relativi: il sito funziona sia alla radice sia su un sottopercorso
  // (GitHub Pages serve su /3Dgallery/).
  base: './',
  plugins: [react()],
});
