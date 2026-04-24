import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import SolarBackground from './background/SolarBackground.jsx'
import useStore from '../hooks/useStore.js'

const STEPS = [
  { path: '/',        label: 'Contact'  },
  { path: '/setup',   label: 'Project'  },
  { path: '/draw',    label: 'Drawing'  },
  { path: '/review',  label: 'Review'   },
  { path: '/confirm', label: 'Confirm'  },
]

function StepBar() {
  const { pathname } = useLocation()
  const currentIdx   = STEPS.findIndex(s => s.path === pathname)
  if (currentIdx === -1) return null

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            0,
      justifyContent: 'center',
    }}>
      {STEPS.map((step, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        return (
          <div key={step.path} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{
                width:      32,
                height:     2,
                background: done ? 'var(--orange)' : 'var(--grey-3)',
                transition: 'background 0.3s',
              }}/>
            )}
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            3,
            }}>
              <div style={{
                width:        22,
                height:       22,
                borderRadius: '50%',
                border:       `2px solid ${done || active ? 'var(--orange)' : 'var(--grey-3)'}`,
                background:   done ? 'var(--orange)' : active ? 'var(--orange-lt)' : '#fff',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                transition:   'all 0.3s',
                fontSize:     10,
                fontWeight:   700,
                color:        done ? '#fff' : active ? 'var(--orange)' : 'var(--grey-4)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize:   9,
                fontWeight: active ? 700 : 400,
                color:      active ? 'var(--orange)' : done ? 'var(--grey-5)' : 'var(--grey-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
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

export default function AppShell({ children }) {
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const { reset }  = useStore()
  const token      = localStorage.getItem('solar_token')

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <SolarBackground />

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav style={{
        position:       'relative',
        zIndex:         10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        height:         56,
        background:     'rgba(253,248,241,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom:   '1px solid var(--grey-3)',
      }}>
        <div
          onClick={() => { reset(); navigate('/') }}
          style={{
            fontFamily:    'var(--font-head)',
            fontSize:      36,
            fontWeight:    900,
            color:         'var(--orange)',
            cursor:        'pointer',
            letterSpacing: '-0.3px',
          }}
        >
          ☀ Solar Calculator
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────── */}
      <motion.main
        key={useLocation().pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
        style={{
          position:   'relative',
          zIndex:     10,
          maxWidth:   640,
          margin:     '0 auto',
          padding:    '32px 16px 64px',
        }}
      >
        {children}
      </motion.main>
    </div>
  )
}