/**
 * @type {Config}
 */
let config

if (process.env.NODE_ENV === 'production') {
  config = (await import('./ecs.js')).default
} else {
  config = (await import('./default.js')).default
}

export default config
