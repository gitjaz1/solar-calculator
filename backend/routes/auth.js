const router = require('express').Router()
const jwt    = require('jsonwebtoken')
const db     = require('../services/db')
const logger = require('../services/logger')
const { authLimiter } = require('../middleware/rateLimit')
const { body, validationResult } = require('express-validator')

function issueGuestToken(data) {
  return jwt.sign(
    {
      userId:         null,
      email:          data.email,
      contactName:    data.contactName,
      companyName:    data.companyName,
      telephone:      data.telephone      ?? '',
      vatNumber:      data.vatNumber      ?? '',
      companyAddress: data.companyAddress ?? '',
      isAdmin:        false,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

// ── POST /auth/start ──────────────────────────────────────────────────
router.post('/start', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('contactName').notEmpty().withMessage('Contact name required'),
  body('companyName').notEmpty().withMessage('Company name required'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    email, contactName, companyName,
    telephone, vatNumber, companyAddress,
  } = req.body

  const token = issueGuestToken({
    email, contactName, companyName,
    telephone, vatNumber, companyAddress,
  })

  logger.info('session_started', { email })

  res.json({
    token,
    user: {
      email, contactName, companyName,
      telephone, vatNumber, companyAddress,
    },
  })
})

// ── POST /auth/admin/login ────────────────────────────────────────────
router.post('/admin/login', authLimiter, [
  body('secret').notEmpty().withMessage('Secret required'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { secret } = req.body
  const expected   = (process.env.ADMIN_SECRET ?? '').replace(/^["']|["']$/g, '').trim()

  if (!expected || secret !== expected) {
    logger.warn('admin_login_failed', { ip: req.ip })
    return res.status(403).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { isAdmin: true, userId: null },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  logger.info('admin_login_success', { ip: req.ip })
  res.json({ token })
})

// ── GET /auth/me ──────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const auth  = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ message: 'No token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    res.json(payload)
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
})

module.exports = router