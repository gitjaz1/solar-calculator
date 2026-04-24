const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  const auth  = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.userId == null) {
      return res.status(403).json({
        message: 'A registered account is required for this action',
      })
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

function optionalToken(req, res, next) {
  const auth  = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!token) {
    req.user = null
    return next()
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret']
  if (!secret || secret !== (process.env.ADMIN_SECRET ?? '').replace(/^["']|["']$/g, '').trim()) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  next()
}

function requireAdminToken(req, res, next) {
  const auth  = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (!payload.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' })
      }
    } catch {
      return res.status(403).json({ message: 'Forbidden' })
    }
  }

  next()
}

module.exports = { verifyToken, optionalToken, requireAdmin, requireAdminToken }