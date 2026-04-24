const rateLimit = require('express-rate-limit')

const generalLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { message: 'Too many requests, please try again later.' },
})

const offerLimiter = rateLimit({
  windowMs:       60 * 60 * 1000,
  max:            5,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { message: 'Offer generation limit reached. Please wait before generating another offer.' },
})

const calculateLimiter = rateLimit({
  windowMs:       60 * 60 * 1000,
  max:            30,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { message: 'Calculation limit reached. Please wait before sending another calculation.' },
})

const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            20,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { message: 'Too many auth attempts, please try again later.' },
})

module.exports = {
  generalLimiter,
  offerLimiter,
  calculateLimiter,
  authLimiter,
}