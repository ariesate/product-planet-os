import { defineConfig } from 'vite'
import path from 'path'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'DocEditor',
      fileName: (format) => `editor.${format}.js`
    },
    rollupOptions: {
      external: ['axii'],
      plugins: [
        typescript({
          declaration: true,
          declarationDir: path.resolve(__dirname, './dist')
        })
      ]
    }
  }
})
