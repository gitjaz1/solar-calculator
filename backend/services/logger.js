const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? ' ' + JSON.stringify(meta)
              : ''
            return `${timestamp} ${level}: ${message}${metaStr}`
          })
        )
  ),
  transports: [new winston.transports.Console()],
})

logger.httpMiddleware = () => (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info('http_request', {
      method:   req.method,
      path:     req.path,
      status:   res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip:       req.ip,
    })
  })
  next()
}

module.exports = logger