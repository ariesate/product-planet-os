export default {
  env: 'dev',
  server: {
    jwtSecret: '5f1a12ccb348'
  },
  database: {
    client: 'sqlite3',
    connection: {
      filename: 'db.sqlite'
    },
    useNullAsDefault: true
  },
  oss: {
    accessKeyId: 'LTAI5tM7X6SbLQS3KfQFgB9x',
    accessKeySecret: 'vlJdcngfVdrBvfhrRWMDlQTVu0ZPCn',
    roleArn: 'acs:ram::1870145513323714:role/aliyunosstokengeneratorrole',
    bucket: 'test-product-planet',
    folder: 'usercontent',
    host: 'https://test-product-planet.oss-cn-hangzhou.aliyuncs.com'
  },
  github: {
    clientId: '5db6ae35e220a33ab432',
    clientSecret: 'e8e714d02d5d89ad8ba21a9159e655cd5a055b0e',
    appName: 'product-planet',
    authUrl: 'https://github.com/login/oauth/authorize',
    authTokenUrl: 'https://github.com/login/oauth/access_token',
    homePage: 'http://localhost:8080/github',
    backPage: 'http://localhost:8080/github'
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
