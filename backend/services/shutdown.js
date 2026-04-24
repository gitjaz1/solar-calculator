const logger = require('./logger')
const db     = require('./db')

const GRACE_MS = parseInt(process.env.SHUTDOWN_GRACE_MS ?? '15000', 10)

let shuttingDown = false

async function shutdown(signal, httpServer) {
  if (shuttingDown) return
  shuttingDown = true

  logger.info('shutdown_initiated', { signal, grace_ms: GRACE_MS })

  const forceTimer = setTimeout(() => {
    logger.error('shutdown_forced', { reason: 'grace period exceeded' })
    process.exit(1)
  }, GRACE_MS)
  forceTimer.unref()

  try {
    await new Promise((resolve, reject) =>
      httpServer.close((err) => (err ? reject(err) : resolve()))
    )
    logger.info('shutdown_http_closed')

    try {
      const { offerQueue } = require('./queue')
      await offerQueue.pause(true)
      const active = await offerQueue.getActiveCount()
      if (active > 0) {
        logger.info('shutdown_waiting_jobs', { active })
        await new Promise((resolve) => {
          const check = setInterval(async () => {
            const n = await offerQueue.getActiveCount()
            if (n === 0) { clearInterval(check); resolve() }
          }, 500)
        })
      }
      await offerQueue.close()
      logger.info('shutdown_queue_closed')
    } catch (qErr) {
      logger.warn('shutdown_queue_error', { error: qErr.message })
    }

    try {
      await db.pool.end()
      logger.info('shutdown_db_closed')
    } catch (dbErr) {
      logger.warn('shutdown_db_error', { error: dbErr.message })
    }

    logger.info('shutdown_complete')
    clearTimeout(forceTimer)
    process.exit(0)
  } catch (err) {
    logger.error('shutdown_error', { error: err.message })
    process.exit(1)
  }
}

function registerShutdown(httpServer) {
  process.on('SIGTERM', () => shutdown('SIGTERM', httpServer))
  process.on('SIGINT',  () => shutdown('SIGINT',  httpServer))

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled_rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack:  reason instanceof Error ? reason.stack?.slice(0, 500) : undefined,
    })
  })

  process.on('uncaughtException', (err) => {
    logger.error('uncaught_exception', { error: err.message, stack: err.stack?.slice(0, 500) })
    process.exit(1)
  })
}

module.exports = { registerShutdown }