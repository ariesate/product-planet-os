import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ViteTips } from 'vite-plugin-tips'

const curDirname = dirname(fileURLToPath(import.meta.url))
/**
 * @type {import('vite').UserConfig}
 */
const config = {
  base: 'https://product-planet.oss-cn-hangzhou.aliyuncs.com/static/',
  server: {
    port: '8080',
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9000',
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
