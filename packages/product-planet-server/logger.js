import { Logger } from '@infra-node/logger'
import config from './config/index.js'

const logger = new Logger(config.logger)

process.on('uncaughtException', (error) => {
  logger.error({
    message: 'uncaughtException',
    err: error
  })
})

export default logger
