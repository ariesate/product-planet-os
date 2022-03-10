export default {
  env: 'production',
  server: {
    jwtSecret: '5f1a12ccb348'
  },
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
    accessKeyId: 'LTAI5tM7X6SbLQS3KfQFgB9x',
    accessKeySecret: 'vlJdcngfVdrBvfhrRWMDlQTVu0ZPCn',
    roleArn: 'acs:ram::1870145513323714:role/aliyunosstokengeneratorrole',
    bucket: 'product-planet',
    folder: 'usercontent',
    host: 'https://product-planet.oss-cn-hangzhou.aliyuncs.com'
  },
  github: {
    clientId: '5db6ae35e220a33ab432',
    clientSecret: 'e8e714d02d5d89ad8ba21a9159e655cd5a055b0e',
    appName: 'product-planet',
    authUrl: 'https://github.com/login/oauth/authorize',
    authTokenUrl: 'https://github.com/login/oauth/access_token',
    homePage: 'http://120.55.189.26/github',
    backPage: 'http://120.55.189.26/github'
  },
  moduleConfig: {
    storage: {
      enable: true,
      options: {
        storageData: 'planet.storage.json',
        objects: []
      }
    }
  },
  service: {}
}
