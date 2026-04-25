const axios  = require('axios')
const logger = require('./logger')

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

function isConfigured() {
  return !!process.env.BREVO_API_KEY
}

async function sendOffer({ to, contactName, companyName, projectName, pdfBuffer, filename }) {
  if (!isConfigured()) {
    logger.warn('email_skipped', { reason: 'BREVO_API_KEY not configured', to })
    return { skipped: true }
  }

  const salesEmail = process.env.SALES_EMAIL
  const appUrl     = process.env.APP_URL ?? 'http://localhost:5173'

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e8521a;">Solar Park Calculator — Offer</h2>
      <p>Dear ${contactName},</p>
      <p>
        Thank you for using the Solar Park Calculator.
        Please find your ballast calculation offer for
        <strong>${projectName}</strong> attached to this email.
      </p>
      <p>
        If you have any questions regarding this offer,
        please do not hesitate to contact us.
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">
        This offer was generated automatically by the Solar Park Calculator.<br/>
        <a href="${appUrl}" style="color: #e8521a;">${appUrl}</a>
      </p>
    </div>
  `

  const attachment = {
    content: pdfBuffer.toString('base64'),
    name:    filename,
  }

  const payload = {
    sender:      { name: 'Solar Calculator', email: process.env.SALES_EMAIL },
    to:          [{ email: to, name: contactName }],
    subject:     `Solar Park Offer — ${projectName}`,
    htmlContent,
    attachment:  [attachment],
  }

  try {
    await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })
    logger.info('email_sent', { to, project: projectName })

    if (salesEmail && salesEmail !== to) {
      const copyPayload = {
        ...payload,
        to:      [{ email: salesEmail, name: 'Solar Calculator' }],
        subject: `[COPY] Solar Park Offer — ${projectName} — ${companyName}`,
      }
      await axios.post(BREVO_API_URL, copyPayload, {
        headers: {
          'api-key':      process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })
      logger.info('email_copy_sent', { to: salesEmail })
    }

    return { sent: true }
  } catch (err) {
    const detail = err.response?.data ?? err.message
    logger.error('email_failed', { error: detail, to })
    throw new Error(`Email failed: ${JSON.stringify(detail)}`)
  }
}

async function sendResetPassword({ to, resetUrl }) {
  if (!isConfigured()) return { skipped: true }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e8521a;">Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href="${resetUrl}"
           style="background: #e8521a; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset password
        </a>
      </p>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">
        If you did not request a password reset, ignore this email.
      </p>
    </div>
  `

  try {
    await axios.post(BREVO_API_URL, {
      sender:      { name: 'Solar Calculator', email: process.env.SALES_EMAIL },
      to:          [{ email: to }],
      subject:     'Reset your Solar Calculator password',
      htmlContent: html,
    }, {
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })
    logger.info('reset_email_sent', { to })
    return { sent: true }
  } catch (err) {
    logger.error('reset_email_failed', { error: err.message })
    throw err
  }
}

module.exports = { sendOffer, sendResetPassword }