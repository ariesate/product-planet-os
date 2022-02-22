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
  git: {
    host: 'https://git.corp.kuaishou.com',
    accessToken: 'VrVM1q2Hhf_ai4Ddob2s',
    namespaceId: 21132
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
