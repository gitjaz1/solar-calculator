import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import AppShell from '../components/AppShell.jsx'
import ZoneGrid from '../components/drawing/ZoneGrid.jsx'
import useStore from '../hooks/useStore.js'
import api from '../utils/api.js'

export default function DrawingPage() {
  const { t }        = useTranslation()
  const navigate     = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    zones,
    activeZoneIdx,
    setActiveZone,
    addZone,
    removeZone,
    project,
    setCalcResult,
  } = useStore()

  const activeZone = zones[activeZoneIdx]

  const handleCalculate = async () => {
    if (!zones.length) {
      toast.error('Add at least one zone before calculating.')
      return
    }

    const hasShelters = zones.some(z =>
      z.grid.some(row => row.some(cell => cell))
    )
    if (!hasShelters) {
      toast.error('Draw at least one shelter before calculating.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/calculate', { zones, project })
      setCalcResult(res.data)
      navigate('/review')
    } catch (err) {
      toast.error(t('drawing.calcError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        {/* ── Zone tabs ──────────────────────────────── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            marginBottom:   16,
          }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              {t('drawing.title')}
            </div>
            <button
              onClick={addZone}
              style={{
                padding:       '7px 16px',
                borderRadius:  'var(--radius)',
                border:        '1.5px dashed var(--orange)',
                background:    'transparent',
                color:         'var(--orange)',
                fontFamily:    'var(--font-head)',
                fontWeight:    700,
                fontSize:      12,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor:        'pointer',
                transition:    'all 0.15s',
              }}
            >
              + {t('drawing.addZone')}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--grey-5)', marginBottom: 16 }}>
            {t('drawing.hint')}
          </p>

          {/* Zone tabs */}
          <div className="zone-tabs">
            {zones.map((zone, idx) => (
              <div
                key={zone.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <button
                  onClick={() => setActiveZone(idx)}
                  style={{
                    padding:       '7px 16px',
                    borderRadius:  'var(--radius)',
                    border:        `1.5px solid ${activeZoneIdx === idx ? 'var(--orange)' : 'var(--grey-3)'}`,
                    background:    activeZoneIdx === idx ? 'var(--orange)' : 'transparent',
                    color:         activeZoneIdx === idx ? 'var(--white)' : 'var(--grey-6)',
                    fontFamily:    'var(--font-head)',
                    fontWeight:    700,
                    fontSize:      12,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    cursor:        'pointer',
                    transition:    'all 0.15s',
                  }}
                >
                  {zone.label}
                </button>
                {zones.length > 1 && (
                  <button
                    onClick={() => removeZone(idx)}
                    style={{
                      padding:       '7px 8px',
                      borderRadius:  'var(--radius)',
                      border:        '1.5px solid var(--grey-3)',
                      background:    'transparent',
                      color:         'var(--grey-4)',
                      fontFamily:    'var(--font-head)',
                      fontWeight:    700,
                      fontSize:      12,
                      cursor:        'pointer',
                      lineHeight:    1,
                      transition:    'all 0.15s',
                    }}
                    title={t('drawing.removeZone')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Active zone grid ───────────────────────── */}
        {activeZone && (
          <motion.div
            key={activeZone.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="card"
          >
            <div className="card-title" style={{ marginBottom: 16 }}>
              {activeZone.label}
            </div>
            <ZoneGrid zoneIdx={activeZoneIdx} />
          </motion.div>
        )}

        {/* ── Actions ────────────────────────────────── */}
        <div className="btn-row">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/setup')}
          >
            {t('nav.back')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? t('drawing.calculating') : t('drawing.calculate')}
          </button>
        </div>
      </motion.div>
    </AppShell>
  )
}