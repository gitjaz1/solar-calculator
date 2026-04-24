const router = require('express').Router()
const logger = require('../services/logger')
const { calcClient }          = require('../services/calcClient')
const { optionalToken }       = require('../middleware/auth')
const { calculateValidators, validate } = require('../middleware/validate')
const { calculateLimiter }    = require('../middleware/rateLimit')

// ── POST /calculate ───────────────────────────────────────────────────
router.post('/', calculateLimiter, optionalToken, calculateValidators, validate, async (req, res, next) => {
  try {
    const { zones, project } = req.body

    logger.info('calculate_request', {
      userId:  req.user?.userId ?? 'guest',
      zones:   zones.length,
      country: project.country,
    })

    const response = await calcClient.post('/calculate', { zones, project }, {
      timeout:   30000,
      requestId: req.headers['x-request-id'],
    })

    res.json(response.data)
  } catch (err) {
    next(err)
  }
})

module.exports = router