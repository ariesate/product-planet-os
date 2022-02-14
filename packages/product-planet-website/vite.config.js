import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ViteTips } from 'vite-plugin-tips'

const curDirname = dirname(fileURLToPath(import.meta.url))
/**
 * @type {import('vite').UserConfig}
 */
const config = {
  server: {
    host: 'product-planet.staging.kuaishou.com',
    port: '4001',
    proxy: {
      '/api': {
        target: 'http://product-planet.staging.kuaishou.com:4000',
        changeOrigin: true
      }
    }
  },
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(curDirname, 'index.html'),
        editor: resolve(curDirname, 'editor.html')
      },
      output: {
        entryFileNames: '[name].js'
      },
      minified: false
    }
  },
  optimizeDeps: {
    include: ['axios']
  },
  resolve: {
    alias: {
      '@': resolve(curDirname, './')
    }
  },
  plugins: [
    ViteTips()
  ],
  define: {
    __DEV__: true
  }
}

export default config
