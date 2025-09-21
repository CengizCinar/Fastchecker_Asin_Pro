import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel.tsx')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        name: 'FastChecker'
      }
    },
    target: 'es2015',
    minify: false,
    sourcemap: false,
    cssCodeSplit: false
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
