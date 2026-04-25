const nodemailer = require('nodemailer')
const logger     = require('./logger')

function createTransport() {
  const host = (process.env.SMTP_HOST ?? '').trim().replace(/^["']|["']$/g, '')
  const user = (process.env.SMTP_USER ?? '').trim().replace(/^["']|["']$/g, '')
  const pass = (process.env.SMTP_PASS ?? '').trim().replace(/^["']|["']$/g, '')

  if (!host || !user || !pass || host === 'smtp.yourprovider.com') {
    return null
  }

  return nodemailer.createTransport({
    host,
    port:              parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure:            process.env.SMTP_PORT === '465',
    auth:              { user, pass },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     10000,
  })
}

async function sendOffer({ to, contactName, companyName, projectName, pdfBuffer, filename }) {
  const transport = createTransport()
  if (!transport) {
    logger.warn('email_skipped', { reason: 'SMTP not configured', to })
    return { skipped: true }
  }

  const salesEmail = process.env.SALES_EMAIL
  const appUrl     = process.env.APP_URL ?? 'http://localhost:5173'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f0a010;">Solar Park Calculator — Offer</h2>
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
        <a href="${appUrl}" style="color: #f0a010;">${appUrl}</a>
      </p>
    </div>
  `

  const mailOptions = {
    from:        `"Solar Calculator" <${process.env.SALES_EMAIL}>`,
    to,
    subject:     `Solar Park Offer — ${projectName}`,
    html,
    attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  }

  try {
    await transport.sendMail(mailOptions)
    logger.info('email_sent', { to, project: projectName })

    if (salesEmail && salesEmail !== to) {
      await transport.sendMail({
        ...mailOptions,
        to:      salesEmail,
        subject: `[COPY] Solar Park Offer — ${projectName} — ${companyName}`,
      })
      logger.info('email_copy_sent', { to: salesEmail })
    }

    return { sent: true }
  } catch (err) {
    logger.error('email_failed', { error: err.message, to })
    throw err
  }
}

async function sendResetPassword({ to, resetUrl }) {
  const transport = createTransport()
  if (!transport) return { skipped: true }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f0a010;">Reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href="${resetUrl}"
           style="background: #f0a010; color: white; padding: 12px 24px;
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
    await transport.sendMail({
      from:    `"Solar Calculator" <${process.env.SALES_EMAIL}>`,
      to,
      subject: 'Reset your Solar Calculator password',
      html,
    })
    logger.info('reset_email_sent', { to })
    return { sent: true }
  } catch (err) {
    logger.error('reset_email_failed', { error: err.message })
    throw err
  }
}

module.exports = { sendOffer, sendResetPassword }