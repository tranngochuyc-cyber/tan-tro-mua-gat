import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    apply: 'build',
    closeBundle() {
      const src = path.resolve(process.cwd(), 'assets');
      const dest = path.resolve(process.cwd(), 'dist/assets');
      const runtimeFolders = ['player', 'enemies', 'tiles', 'weapons', 'music'];
      for (const folder of runtimeFolders) {
        const source = path.join(src, folder);
        if (fs.existsSync(source)) {
          fs.cpSync(source, path.join(dest, folder), { recursive: true });
        }
      }
      console.log('[copy-assets] Copied runtime game assets to dist/assets/');
    },
  };
}

export default defineConfig({
  root: '.',
  base: process.env.GITHUB_PAGES === 'true' ? '/tan-tro-mua-gat/' : './',
  publicDir: false,
  plugins: [copyAssetsPlugin()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
