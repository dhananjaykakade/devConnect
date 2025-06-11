import pino from 'pino'
import { config } from '../config/config.service'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
  level: config.isProd ? 'info' : 'debug',
})

export default logger