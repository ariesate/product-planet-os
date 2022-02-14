/**
 * @type {Config}
 */
let config

if (process.env.NODE_ENV === 'production') {
  const { createKconf } = await import('@infra-node/kconf')
  const kconf = createKconf({
    env: process.env.APP_ENV || 'staging'
  })
  config = await kconf.getJSONValue('ad.frontend.product-planet')
} else {
  config = (await import('./default.js')).default
}

export default config
