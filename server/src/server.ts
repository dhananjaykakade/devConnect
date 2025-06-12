import http from 'http'
import app from './app'
import { config } from './config/config.service'
import logger from './utils/logger'
import {setupWebSocket } from './websocket/index'

const server = http.createServer(app)
const PORT = config.port

// Start server
setupWebSocket(server)
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Gracefully shutting down (${signal})`)
  server.close(() => {
    logger.info('💥 Server closed')
    process.exit(0)
  })
}

// Process Signal Handlers
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGUSR2']
signals.forEach((signal) => {
  process.on(signal, () => {
    logger.info(`Received ${signal}`)
    gracefulShutdown(signal)
  })
})

// Process Event Handlers
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, ' Uncaught Exception')
  process.exit(1)
})

process.on('uncaughtExceptionMonitor', (err) => {
  logger.fatal({ err }, 'Uncaught Exception Monitor')
})

process.on('unhandledRejection', (reason: any) => {
  logger.error({ reason }, 'Unhandled Rejection')
})

process.on('unhandledRejectionMonitor', (reason: any) => {
  logger.error({ reason }, 'Unhandled Rejection Monitor')
})

process.on('warning', (warning) => {
  logger.warn({ warning }, 'Process Warning')
})

process.on('beforeExit', (code) => {
  logger.info(`🔚 Process beforeExit with code: ${code}`)
})

process.on('exit', (code) => {
  logger.info(`Process exited with code: ${code}`)
})
