import type { Knex } from 'knex'
declare global {
  type KnexInstance = Knex
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
    readonly service: Readonly<Config.Service>
    readonly database: Readonly<Knex.Config>
    readonly oss: Readonly<Config.OSS>
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
    interface Database {
      client: string
      connection: any
    }
    interface OSS {
      accessKeyId: string
      accessKeySecret: string
      roleArn: string
      bucket: string
      folder: string
      host: string
    }
    interface Service {}
  }
}
