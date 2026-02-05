import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

// Dependências pesadas que devem ser externalizadas no SSR/Nitro para evitar OOM
const heavyExternals = [
  // Editor de código
  'monaco-editor',
  '@monaco-editor/react',
  // Rich text editor
  'reactjs-tiptap-editor',
  '@tiptap/react',
  '@tiptap/pm',
  '@tiptap/extensions',
  '@tiptap/extension-document',
  '@tiptap/extension-hard-break',
  '@tiptap/extension-list',
  '@tiptap/extension-paragraph',
  '@tiptap/extension-text',
  '@tiptap/starter-kit',
  // PDF
  '@react-pdf/renderer',
  'react-pdf-html',
  // Charts (recharts + d3 ecosystem)
  'recharts',
  // Drag and drop
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  // Date utilities
  'date-fns',
];

const config = defineConfig({
  server: {
    port: 5173,
  },
  plugins: [
    devtools(),
    nitro({
      noExternals: [],
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        routeToken: 'layout',
      },
    }),
    viteReact(),
  ],
  ssr: {
    // Externalizar dependências pesadas do SSR para evitar OOM no Nitro
    external: heavyExternals,
  },
  build: {
    // Aumentar o limite de aviso de chunk para evitar warnings desnecessarios
    chunkSizeWarningLimit: 1000,
  },
});

export default config;
