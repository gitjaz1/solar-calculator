const { Pool } = require('pg')
const logger   = require('./logger')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max:              10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('connect', () => {
  logger.debug('db_pool_connected')
})

pool.on('error', (err) => {
  logger.error('db_pool_error', { error: err.message })
})

async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    logger.debug('db_query', {
      duration: `${Date.now() - start}ms`,
      rows:     result.rowCount,
    })
    return result
  } catch (err) {
    logger.error('db_query_error', {
      error: err.message,
      query: text,
    })
    throw err
  }
}

module.exports = { pool, query }