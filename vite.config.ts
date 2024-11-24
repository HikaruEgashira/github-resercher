import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/extension.ts'),
    },
    rollupOptions: {
      external: ['vscode', /node:.*/],
      input: {
        extension: path.resolve(__dirname, 'src/extension.ts'),
      },
      output: [
        {
          format: 'cjs',
          entryFileNames: '[name].js',
          dir: 'out'
        },
        {
          format: 'es',
          entryFileNames: '[name].[format].js',
          dir: 'out'
        }
      ]
    },
    sourcemap: true,
    outDir: 'out',
    emptyOutDir: false
  },
  define: {
    'process.env': process.env,
  }
});
