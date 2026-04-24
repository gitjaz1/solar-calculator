import React from 'react'
import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppShell from '../components/AppShell.jsx'
import { ProgressBar } from '../components/UIKit.jsx'
import useStore from '../hooks/useStore.js'
import useJobPoller from '../hooks/useJobPoller.js'

const SOLAR_FACTS = [
  "The sun delivers more energy to Earth in one hour than humanity uses in an entire year.",
  "A single solar panel produces enough energy to power a laptop for over 40 hours from one day of sunlight.",
  "Solar panels work on cloudy days — they generate around 10 to 25% of their rated capacity in diffuse light.",
  "The largest solar farm in the world covers an area larger than the city of Paris.",
  "Silicon, the material in most solar cells, is the second most abundant element in Earth's crust.",
]

function SolarFact() {
  const [fact] = React.useState(
    () => SOLAR_FACTS[Math.floor(Math.random() * SOLAR_FACTS.length)]
  )
  return (
    <div style={{
      marginTop:    20,
      padding:      '14px 18px',
      background:   'var(--orange-lt)',
      borderLeft:   '3px solid var(--orange)',
      borderRadius: 'var(--radius)',
      textAlign:    'left',
    }}>
      <div style={{
        fontSize:      10,
        fontWeight:    700,
        color:         'var(--orange)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom:  6,
        fontFamily:    'var(--font-head)',
      }}>
        Did you know?
      </div>
      <p style={{ fontSize: 13, color: 'var(--grey-7)', lineHeight: 1.6 }}>
        {fact}
      </p>
    </div>
  )
}

const STEPS = [
  { key: 'queued',    label: 'Queued'     },
  { key: 'active',    label: 'Generating' },
  { key: 'sending',   label: 'Sending'    },
  { key: 'completed', label: 'Done'       },
]

function stepIndex(status, progress) {
  if (status === 'completed')                return 3
  if (status === 'active' && progress >= 75) return 2
  if (status === 'active')                   return 1
  return 0
}

function StepTracker({ status, progress }) {
  const current = stepIndex(status, progress)
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      margin:         '20px 0 8px',
    }}>
      {STEPS.map((step, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width:      40,
                height:     2,
                background: done || active ? 'var(--orange)' : 'var(--grey-3)',
                transition: 'background 0.4s',
              }}/>
            )}
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           4,
            }}>
              <div style={{
                width:          28,
                height:         28,
                borderRadius:   '50%',
                border:         `2px solid ${done || active ? 'var(--orange)' : 'var(--grey-3)'}`,
                background:     done ? 'var(--orange)' : active ? 'var(--orange-lt)' : '#fff',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                transition:     'all 0.4s',
                boxShadow:      active ? '0 0 0 4px var(--orange-lt)' : 'none',
              }}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--orange)' : 'var(--grey-3)' }}/>
                }
              </div>
              <span style={{
                fontSize:      10,
                fontWeight:    active ? 700 : 400,
                color:         active ? 'var(--orange)' : done ? 'var(--grey-6)' : 'var(--grey-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}>
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ConfirmPage() {
  const { t }           = useTranslation()
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const jobId           = params.get('jobId')
  const { user, reset } = useStore()
  const [retryKey, setRetryKey] = useState(0)

  const { status, progress, result, error } = useJobPoller(jobId, retryKey)

  const isComplete = status === 'completed'
  const isFailed   = status === 'failed' || !!error
  const isRunning  = !isComplete && !isFailed

  const handleNew   = () => { reset(); navigate('/') }
  const handleBack  = () => navigate('/review')
  const handleRetry = useCallback(() => {
    if (jobId) setRetryKey(k => k + 1)
    else navigate('/review')
  }, [jobId, navigate])

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <div className="card" style={{
          textAlign: 'center',
          padding:   '48px 32px',
          maxWidth:  560,
          margin:    '0 auto',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>
            {isComplete ? '✅' : isFailed ? '❌' : '⏳'}
          </div>

          <h1 style={{
            fontFamily:   'var(--font-head)',
            fontSize:     26,
            marginBottom: 12,
          }}>
            {isComplete
              ? t('confirm.offerSent')
              : isFailed
              ? t('confirm.failed')
              : t('confirm.preparing')
            }
          </h1>

          {isRunning && (
  <>
    <StepTracker status={status} progress={progress} />
    <ProgressBar value={progress} />
    <SolarFact />
  </>
)}

          {isComplete && (
            <>
              <p style={{
                color:      'var(--grey-6)',
                fontSize:   15,
                maxWidth:   440,
                margin:     '0 auto 24px',
                lineHeight: 1.6,
              }}>
                {t('confirm.successMsg', { email: user?.email })}
              </p>

              {result?.downloadToken && (
                <>
                  <a
                    href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/offer/download/${result.offerRef}?token=${encodeURIComponent(result.downloadToken)}`}
                    download={result.filename}
                    className="btn btn-primary"
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      gap:            8,
                      textDecoration: 'none',
                      marginBottom:   8,
                    }}
                  >
                    ⬇ {t('confirm.downloadPdf')}
                  </a>
                  <p style={{ fontSize: 11, color: 'var(--grey-6)', marginTop: 4 }}>
                    {t('confirm.downloadNote')}
                  </p>
                </>
              )}

              <div style={{
                display:        'flex',
                gap:            12,
                justifyContent: 'center',
                marginTop:      24,
              }}>
                <button className="btn btn-secondary" onClick={handleNew}>
                  {t('confirm.startNew')}
                </button>
              </div>
            </>
          )}

          {isFailed && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                background:   '#fff5f5',
                border:       '1.5px solid #fecaca',
                borderRadius: 8,
                padding:      '16px 20px',
                marginBottom: 20,
                textAlign:    'left',
              }}>
                <p style={{
                  fontSize:     14,
                  fontWeight:   600,
                  color:        '#b91c1c',
                  marginBottom: 4,
                }}>
                  {t('confirm.errorGeneric')}
                </p>
                {error && (
                  <p style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.5 }}>
                    {error}
                  </p>
                )}
              </div>

              <div style={{
                display:        'flex',
                gap:            12,
                justifyContent: 'center',
                flexWrap:       'wrap',
              }}>
                <button className="btn btn-primary" onClick={handleRetry}>
                  ↻ {t('confirm.retry')}
                </button>
                <button className="btn btn-secondary" onClick={handleBack}>
                  ← {t('nav.backToReview')}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AppShell>
  )
}