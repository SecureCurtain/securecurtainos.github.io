// jb7572_2026-08-24: Vite Build & Development Server Configuration
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

// Plugin to reliably serve binary download assets (zip, tar.gz, hydrator.sh) without SPA html fallback
const serveDownloadsPlugin: Plugin = {
  name: 'serve-archive-downloads',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url ? req.url.split('?')[0] : '';
      const url = decodeURIComponent(rawUrl);

      // Handle ZIP downloads
      if (
        url === '/securecurtain.zip' || 
        url === '/securecurtain-source.zip' || 
        url === '/download/zip' || 
        url === '/api/download/zip'
      ) {
        let filePath = path.resolve(__dirname, 'public/securecurtain.zip');
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'public/securecurtain-source.zip');
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'dist/securecurtain.zip');
        }
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="securecurtain.zip"',
            'Content-Length': fs.statSync(filePath).size,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          return fs.createReadStream(filePath).pipe(res);
        }
      }

      // Handle TAR.GZ downloads
      if (
        url === '/securecurtain.tar.gz' || 
        url === '/securecurtain-source.tar.gz' || 
        url === '/download/tar' || 
        url === '/api/download/tar'
      ) {
        let filePath = path.resolve(__dirname, 'public/securecurtain.tar.gz');
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'public/securecurtain-source.tar.gz');
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'dist/securecurtain.tar.gz');
        }
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            'Content-Type': 'application/gzip',
            'Content-Disposition': 'attachment; filename="securecurtain.tar.gz"',
            'Content-Length': fs.statSync(filePath).size,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          return fs.createReadStream(filePath).pipe(res);
        }
      }

      // Handle Hydrator Script downloads
      if (
        url === '/hydrator.sh' || 
        url === '/public/hydrator.sh' ||
        url === '/hydrate_SecureCurtain.sh' ||
        url === '/public/hydrate_SecureCurtain.sh' ||
        url === '/full_source_hydrator.sh' || 
        url === '/public/full_source_hydrator.sh' ||
        url === '/full source hydrator.sh' || 
        url === '/public/full%20source%20hydrator.sh' ||
        url === '/download/hydrator' ||
        url === '/api/download/hydrator' ||
        url.endsWith('.sh')
      ) {
        const scriptName = (url.endsWith('.sh') ? path.basename(url) : 'hydrator.sh') || 'hydrator.sh';
        let filePath = path.resolve(__dirname, 'public', scriptName);
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'public/hydrator.sh');
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'dist/hydrator.sh');
        }
        if (!fs.existsSync(filePath)) {
          filePath = path.resolve(__dirname, 'hydrator.sh');
        }
        if (fs.existsSync(filePath)) {
          res.writeHead(200, {
            'Content-Type': 'text/x-shellscript; charset=utf-8',
            'Content-Disposition': `inline; filename="${scriptName}"`,
            'Content-Length': fs.statSync(filePath).size,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          return fs.createReadStream(filePath).pipe(res);
        }
      }
      next();
    });
  }
};

// jb7572_2026-08-24: Configuration export
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), serveDownloadsPlugin],
    resolve: {
      // Root alias resolution for module paths
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
