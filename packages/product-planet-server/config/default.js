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
    clientId: '434e012483fc722007e8',
    clientSecret: '1a6e25a2153df9dd6d97b32ed5f6944607fd51b3',
    appName: 'product-planet-dev',
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
  service: {},
  versionTable: {
    versionJSON: 'planet.storage.version.json',
    versionHistoryJSON: 'planet.storage.version.history.json',
    tables: ['Page', 'Action', 'UseCase', 'PageStatus', 'PagePin', 'Markup', 'LocalMeta'],
    // tables: ['UseCase'],
    entityPostfix: {
      history: 'IVH', // 'InVersionHistory',
      partial: 'IVP' // 'InVersionPartial'
    },
    extraColumn: {
      versionId: 'number',
      versionBaseId: 'number',
      versionOriginId: 'number',
      versionGroupId: 'number',
      versionRemove: 'boolean',
      versionAdd: 'boolean',
      versionPartial: 'boolean'
    }
  }
}
