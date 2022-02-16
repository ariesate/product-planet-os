/**
 * @type {Config}
 */
let config

if (process.env.NODE_ENV === 'production') {
  // TODO: 加载配置文件
  config = (await import('./default.js')).default
} else {
  config = (await import('./default.js')).default
}

export default config
