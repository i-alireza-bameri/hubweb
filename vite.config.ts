import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const pathfinderStubPlugin = (): Plugin => ({
  name: 'pathfinder-ide-stub',
  resolveId(id) {
    if (id === '@pathfinder-ide/react' || id.startsWith('@pathfinder-ide/')) {
      return `\0${id}`;
    }
  },
  load(id) {
    if (id.startsWith('\0@pathfinder-ide/')) {
      return 'export default {}; export const usePathfinder = () => ({}); export const PathfinderProvider = ({ children }: any) => children;';
    }
  },
});

export default defineConfig(() => {
  return {
    plugins: [pathfinderStubPlugin(), react(), tailwindcss()],
    resolve: {
      alias: [
        {
          find: /^@\//,
          replacement: `${path.resolve(import.meta.dirname, '.')}/`,
        },
      ],
    },
    optimizeDeps: {
      exclude: ['@pathfinder-ide/react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
