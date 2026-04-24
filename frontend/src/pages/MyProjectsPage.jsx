import React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppShell from '../components/AppShell.jsx'
import { CardSkeleton, EmptyState } from '../components/UIKit.jsx'
import useStore from '../hooks/useStore.js'
import api from '../utils/api.js'

export default function MyProjectsPage() {
  const { t }       = useTranslation()
  const navigate    = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const setProject        = useStore(s => s.setProject)
  const setCalcResult     = useStore(s => s.setCalcResult)
  const setSavedProjectId = useStore(s => s.setSavedProjectId)
  const reset             = useStore(s => s.reset)

  const token = localStorage.getItem('solar_token')

  useEffect(() => {
    if (!token) { navigate('/'); return }
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(e => setError(e.response?.data?.message ?? t('projects.loadError')))
      .finally(() => setLoading(false))
  }, [token, navigate, t])

  const openProject = (proj) => {
    setProject({
      name:               proj.name,
      reference:          proj.reference          ?? '',
      country:            proj.country,
      panelThickness:     proj.panel_thickness,
      panelLength:        proj.panel_length        ?? 2000,
      consequenceClass:   proj.consequence_class,
      designWorkingLife:  proj.design_working_life,
      basicWindVelocity:  proj.basic_wind_velocity,
      terrainCategory:    proj.terrain_category,
      tileThickness:      proj.tile_thickness,
    })
    const zones = Array.isArray(proj.zones) ? proj.zones : []
    useStore.setState({ zones, activeZoneIdx: 0 })
    if (proj.calc_result) setCalcResult(proj.calc_result)
    setSavedProjectId(proj.id)
    navigate('/draw')
  }

  const newCalc = () => { reset(); navigate('/') }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   24,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-head)',
            fontSize:   22,
            fontWeight: 700,
          }}>
            {t('projects.title')}
          </h1>
          <button className="btn btn-primary" onClick={newCalc}>
            + {t('nav.newCalculation')}
          </button>
        </div>

        {loading && (
          <>
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
          </>
        )}

        {error && (
          <div className="card" style={{ color: '#d32f2f', padding: 24 }}>
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="card">
            <EmptyState
              icon="☀️"
              message={t('projects.empty')}
              ctaLabel={t('projects.startNew')}
              onCta={newCalc}
            />
          </div>
        )}

        {projects.map(proj => (
          <div
            key={proj.id}
            className="card"
            style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {proj.name}
              </div>
              <div style={{
                fontSize:   12,
                color:      'var(--grey-6)',
                lineHeight: 1.8,
              }}>
                {proj.reference && (
                  <><strong>{t('projects.ref')}:</strong> {proj.reference} &nbsp;·&nbsp;</>
                )}
                <strong>{proj.country}</strong>
                {proj.shelters != null && (
                  <> &nbsp;·&nbsp; {proj.shelters} {t('common.shelters')}</>
                )}
                &nbsp;·&nbsp;
                {new Date(proj.updated_at).toLocaleDateString('en-GB', {
                  day:   '2-digit',
                  month: 'short',
                  year:  'numeric',
                })}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => openProject(proj)}
            >
              {t('common.open')}
            </button>
          </div>
        ))}
      </motion.div>
    </AppShell>
  )
}