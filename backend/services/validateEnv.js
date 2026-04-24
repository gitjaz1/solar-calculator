const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

const RULES = [
  {
    key:     'DATABASE_URL',
    test:    (v) => v?.startsWith('postgres'),
    message: 'Must be a valid PostgreSQL connection string (postgres://...)',
  },
  {
    key:     'JWT_SECRET',
    test:    (v) => v && v.length >= 32,
    message: 'Must be at least 32 characters',
  },
  {
    key:     'PDF_HMAC_SECRET',
    test:    (v) => v && v.length >= 24 && v !== process.env.JWT_SECRET,
    message: 'Must be at least 24 characters AND different from JWT_SECRET',
  },
  {
    key:     'ADMIN_SECRET',
    test:    (v) => v && v.length >= 16,
    message: 'Must be at least 16 characters',
  },
  ...(isProd ? [
    {
      key:     'CORS_ORIGIN',
      test:    (v) => v && v.length > 0,
      message: 'Must be set to your domain in production',
    },
  ] : []),
]

const PLACEHOLDERS = ['change_me', 'your_', 'example', 'placeholder', 'secret123']

function looksLikePlaceholder(val) {
  if (!val) return false
  return PLACEHOLDERS.some(p => val.toLowerCase().includes(p))
}

function validateEnv() {
  const errors   = []
  const warnings = []

  for (const rule of RULES) {
    const val = process.env[rule.key]
    if (!rule.test(val)) {
      if (isTest) {
        warnings.push(`  ⚠  ${rule.key} not set — using fallback`)
        continue
      }
      errors.push(`  ✗ ${rule.key}: ${rule.message}`)
    } else if (looksLikePlaceholder(val) && !isTest) {
      warnings.push(`  ⚠  ${rule.key} looks like a placeholder`)
    }
  }

  if (warnings.length) {
    console.warn('\n[env] Warnings:')
    warnings.forEach(w => console.warn(w))
  }

  if (errors.length) {
    console.error('\n[env] FATAL — Invalid environment:')
    errors.forEach(e => console.error(e))
    process.exit(1)
  }
}

module.exports = validateEnv