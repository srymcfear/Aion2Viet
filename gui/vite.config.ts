import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    viteSingleFile()
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true
  }
});
