import config from './vite.config.js'

export default {
  ...config,
  server: {
    port: '8080',
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9000',
        changeOrigin: true
      }
    }
  }
}
