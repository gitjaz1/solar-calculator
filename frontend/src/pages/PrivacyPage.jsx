import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppShell from '../components/AppShell.jsx'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontFamily:    'var(--font-head)',
        fontSize:      15,
        fontWeight:    700,
        color:         'var(--black)',
        marginBottom:  10,
        paddingBottom: 6,
        borderBottom:  '1px solid var(--grey-2)',
      }}>
        {title}
      </h2>
      <div style={{
        fontSize:   13,
        color:      'var(--grey-7)',
        lineHeight: 1.8,
      }}>
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>

          <div style={{ marginBottom: 28 }}>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Privacy Policy
            </div>
            <p style={{ fontSize: 12, color: 'var(--grey-5)' }}>
              Last updated: January 2026
            </p>
          </div>

          <Section title="1. Who we are">
            <p>
              This Privacy Policy explains how the Solar Park Calculator collects,
              uses, and protects your personal data when you use this tool to
              generate ballast calculations and PDF offers for solar park installations.
            </p>
            <p style={{ marginTop: 8 }}>
              For questions about this policy or your data, contact us at the
              email address provided during your registration.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>When you use the calculator we collect:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
              <li><strong>Contact information</strong> — company name, contact person, telephone, email address, VAT number, and company address</li>
              <li><strong>Project data</strong> — project name, location, technical parameters, and zone layouts you draw</li>
              <li><strong>Usage data</strong> — pages visited, calculation requests, and offer generation events for service monitoring</li>
              <li><strong>Google account data</strong> — if you sign in with Google, we receive your name and email address from Google</li>
            </ul>
          </Section>

          <Section title="3. Why we collect it">
            <p>Your data is used exclusively to:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
              <li>Generate your ballast calculation and PDF offer</li>
              <li>Send the offer to your email address</li>
              <li>Save and retrieve your projects if you have an account</li>
              <li>Monitor service health and fix technical issues</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              We do not use your data for marketing, profiling, or any purpose
              other than providing the calculator service.
            </p>
          </Section>

          <Section title="4. Legal basis (GDPR)">
            <p>
              We process your personal data on the basis of your explicit consent,
              which you provide by ticking the consent checkbox before using the
              calculator. You may withdraw consent at any time by contacting us —
              this will result in deletion of your account and associated data.
            </p>
          </Section>

          <Section title="5. Data storage and retention">
            <p>
              Your data is stored on secured servers. Project data and contact
              information are retained for as long as your account is active.
              Generated PDF offers are automatically deleted after 48 hours.
              Guest session data is never stored — it exists only for the duration
              of your browser session.
            </p>
          </Section>

          <Section title="6. Data sharing">
            <p>
              We do not sell, rent, or share your personal data with third parties
              except where strictly necessary to operate the service:
            </p>
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
              <li><strong>Email delivery</strong> — your email address and PDF offer are passed to our email delivery provider (Brevo) solely to send you the offer</li>
              <li><strong>Google</strong> — if you use Google sign-in, Google processes your authentication under their own privacy policy</li>
            </ul>
          </Section>

          <Section title="7. Your rights">
            <p>Under GDPR you have the right to:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Rectification</strong> — ask us to correct inaccurate data</li>
              <li><strong>Erasure</strong> — ask us to delete your data ("right to be forgotten")</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
              <li><strong>Objection</strong> — object to processing of your data</li>
              <li><strong>Withdraw consent</strong> — withdraw consent at any time without affecting the lawfulness of prior processing</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              To exercise any of these rights, contact us by email. We will respond
              within 30 days.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              This application does not use tracking cookies or third-party
              advertising cookies. We use browser localStorage and sessionStorage
              solely to maintain your session and save your project state between
              page loads. No data is shared with advertisers.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              All data is transmitted over HTTPS. Passwords are hashed using
              bcrypt and never stored in plain text. Access to the database is
              restricted to the application server. We apply industry-standard
              security practices and review them regularly.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we will
              update the date at the top of this page. Continued use of the
              calculator after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <div style={{
            marginTop:    24,
            paddingTop:   16,
            borderTop:    '1px solid var(--grey-2)',
            textAlign:    'center',
          }}>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ textDecoration: 'none', fontSize: 12 }}
            >
              ← Back to calculator
            </Link>
          </div>

        </div>
      </motion.div>
    </AppShell>
  )
}