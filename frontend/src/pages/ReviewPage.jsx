import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import AppShell from '../components/AppShell.jsx'
import { OfferSummary, BallastPlanGrid } from '../components/offer/index.js'
import useStore from '../hooks/useStore.js'
import { generateOffer } from '../utils/api.js'

function StatRow({ label, value, highlight }) {
  return (
    <tr>
      <td style={{
        padding:  '7px 0',
        color:    'var(--grey-6)',
        fontSize: 13,
        width:    '55%',
      }}>
        {label}
      </td>
      <td style={{
        padding:    '7px 0',
        fontWeight: highlight ? 700 : 500,
        fontSize:   13,
        color:      highlight ? 'var(--orange)' : 'inherit',
      }}>
        {value}
      </td>
    </tr>
  )
}

export default function ReviewPage() {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const { user, project, zones, calcResult } = useStore()

  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setReady(true)
  }, [])

  const offerMutation = useMutation({
    mutationFn: () => generateOffer({ user, project, zones, calcResult }),
    onSuccess: (res) => {
      const { jobId } = res.data
      navigate(`/confirm?jobId=${jobId}`)
    },
    onError: () => toast.error(t('review.offerError')),
  })

  if (!ready) return null

  if (!calcResult) {
    navigate('/draw')
    return null
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        {/* ── BOM ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-title">{t('review.bomTitle')}</div>
          <OfferSummary
            bom            = {calcResult.bom ?? {}}
            subtotal       = {calcResult.subtotal}
            discountPct    = {calcResult.discount_pct}
            discountAmount = {calcResult.discount_amount}
            totalPrice     = {calcResult.total_price}
          />
        </div>

        {/* ── Logistics ───────────────────────────────── */}
        <div className="card">
          <div className="card-title">{t('review.logisticsTitle')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <StatRow
                label={t('review.totalShelters')}
                value={calcResult.total_shelters}
              />
              <StatRow
                label={t('review.totalTiles')}
                value={calcResult.total_tiles}
              />
              <StatRow
                label={t('review.totalWeight')}
                value={`${Math.round(calcResult.total_ballast_weight_kg).toLocaleString()} ${t('common.kg')}`}
              />
              <StatRow
                label={t('review.trucks')}
                value={calcResult.approx_trucks}
                highlight
              />
            </tbody>
          </table>
        </div>

        {/* ── Ballast plans ────────────────────────────── */}
        {calcResult.zones?.map(z => (
          <div key={z.zone_id} className="card">
            <div className="card-title" style={{ fontSize: 14 }}>
              {z.label} — {t('review.ballastPlan')}
              <span style={{
                fontSize:   12,
                fontWeight: 400,
                color:      'var(--grey-6)',
                marginLeft: 12,
              }}>
                {z.shelters} {t('common.shelters')} ·{' '}
                {z.tiles_total} {t('common.tiles')} ·{' '}
                {z.ballast_positions} {t('common.positions')}
              </span>
            </div>
            <BallastPlanGrid
              ballastGrid   = {z.ballast_grid}
              tileThickness = {project.tileThickness}
            />
          </div>
        ))}

        {/* ── Actions ──────────────────────────────────── */}
        <div className="card" style={{
          background: 'var(--orange-lt)',
          border:     '1.5px solid var(--orange)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--grey-7)', marginBottom: 16 }}>
            {t('review.offerNote', { email: user?.email })}
          </p>
          <div style={{
            display:        'flex',
            justifyContent: 'flex-end',
          }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!offerMutation.isPending && !offerMutation.isSuccess) {
                  offerMutation.mutate()
                }
              }}
              disabled={offerMutation.isPending || offerMutation.isSuccess}
            >
              {offerMutation.isPending
                ? t('review.sending')
                : offerMutation.isSuccess
                ? '✓ Sent'
                : t('review.sendOffer')
              }
            </button>
          </div>
        </div>

        {/* ── Back button ──────────────────────────────── */}
        <div className="btn-row">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/draw')}
          >
            {t('nav.backToDrawing')}
          </button>
        </div>

      </motion.div>
    </AppShell>
  )
}