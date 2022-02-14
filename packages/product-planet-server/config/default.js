export default {
  env: 'dev',
  server: {
    domain: 'http://product-planet-local.staging.kuaishou.com'
  },
  logger: {
    appName: 'product-planet',
    isConsole: true,
    isFile: true,
    fileOptions: {
      dirname: './logs/product-planet',
      maxSize: '64m',
      datePattern: 'YYYY.MM.DD',
      maxFiles: '10'
    }
  },
  database: {
    client: 'sqlite3',
    connection: {
      filename: 'db.sqlite'
    }
  },
  git: {
    host: 'https://git.corp.kuaishou.com',
    accessToken: 'VrVM1q2Hhf_ai4Ddob2s',
    namespaceId: 21132
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
  service: {
    lcdpDomain: 'https://qianxiang-3.test.gifshow.com',
    firefly: {
      baseUrl: 'http://172.19.101.30:3002/rest/firefly',
      kcName: 'firefly_productPlanet',
      kcData:
        'ChVmaXJlZmx5X3Byb2R1Y3RQbGFuZXQSYFaB0mLV261wczzKQeU/wGt18o5wuVZHPd6eIgB7fwQvyiUC80gGUWTZgdQ6z+WKtEgukCLlkXUyT9nrF5RMvswIGsJEzTyfkWHxPDNROo583ACrYFa1K7evo6SbLVw7XRoSo1cDd3QHgZ2SCgpN4YMGMel3IiDo/9qr/nvr+ItjzknI5kSglsaneVijgDp1C+a98IzGWygPMAE=',
      stage: 'staging'
    }
  }
}
