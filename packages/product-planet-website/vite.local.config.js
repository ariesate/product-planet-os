import config from './vite.config.js'

export default {
  ...config,
  server: {
    host: 'product-planet-local.staging.kuaishou.com',
    port: '4001',
    open: true,
    proxy: {
      '/api': {
        target: 'http://product-planet-local.staging.kuaishou.com',
        changeOrigin: true
      }
    }
  }
}
