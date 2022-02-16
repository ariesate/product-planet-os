import type { Knex } from 'knex'
declare global {
  interface Config {
    /**
     * 判断当前环境类型
     * @description
     *  - 'prod' 生产环境
     *  - 'test' candidate环境
     *  - 'staging' 开发、测试环境
     *  - 'dev' 本地环境
     */
    readonly env: 'dev' | 'staging' | 'test' | 'prod'
    readonly server: Readonly<Config.Server>
    readonly git: Readonly<Config.Git>
    readonly service: Readonly<Config.Service>
    readonly database: Readonly<Knex.Config>
    readonly moduleConfig: Readonly<Record<string, any>>
  }
  namespace Config {
    interface Server {
      jwtSecret: string
      /**
       * 域名
       */
      domain: string
    }
    interface Git {
      /**
       * 域名
       */
      host: string
      accessToken: string
      namespaceId: number
    }
    interface Database {
      client: string
      connection: any
    }
    interface Service {
      /**
       * 千象服务域名
       */
      lcdpDomain: string
      firefly: Readonly<Service.Firefly>
    }
    namespace Service {
      interface Firefly {
        baseUrl: string
        kcName: string
        kcData: string
        stage: 'production' | 'testing' | 'staging'
      }
    }
  }
}
