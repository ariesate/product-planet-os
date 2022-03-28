export default {
  env: 'production',
  database: {
    client: 'mysql',
    connection: {
      host: 'mysql',
      port: 3306,
      user: 'planet',
      password: 'planet',
      database: 'planet'
    }
  },
  oss: {
    bucket: 'product-planet',
    host: 'https://product-planet.oss-cn-hangzhou.aliyuncs.com'
  },
  github: {
    clientId: '5db6ae35e220a33ab432',
    clientSecret: 'e8e714d02d5d89ad8ba21a9159e655cd5a055b0e',
    appName: 'product-planet',
    homePage: 'http://120.55.189.26/github',
    backPage: 'http://120.55.189.26/github'
  }
}
