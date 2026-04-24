import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import AppShell from '../components/AppShell.jsx'
import api from '../utils/api.js'

const ARTICLE_LABELS = {
  '200101': 'Shelter',
  '200201': 'Interconnection Serial',
  '200301': 'Interconnection Parallel',
  '100701': 'Module clamp 25mm',
  '100801': 'Module clamp 30mm',
  '100901': 'Module clamp 35mm',
  '100601': 'Ballast Carrier',
}

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? ''

function adminHeaders() {
  const token = localStorage.getItem('solar_admin_token')
  return {
    'X-Admin-Secret': ADMIN_SECRET,
    'Authorization':  token ? `Bearer ${token}` : '',
  }
}

// ── Stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background:    'var(--white)',
      borderRadius:  'var(--radius)',
      boxShadow:     'var(--shadow-sm)',
      padding:       '18px 22px',
      borderTop:     accent ? '3px solid var(--orange)' : '3px solid transparent',
    }}>
      <div style={{
        fontSize:      11,
        fontWeight:    700,
        color:         'var(--grey-5)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontFamily:    'var(--font-head)',
        marginBottom:  4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   30,
        fontWeight: 800,
        fontFamily: 'var(--font-head)',
        color:      accent ? 'var(--orange)' : 'var(--black)',
      }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--grey-5)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  completed: '#2e7d32',
  failed:    '#c62828',
  active:    '#1565c0',
  queued:    '#f57c00',
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] ?? '#666'
  return (
    <span style={{
      background:   `${color}18`,
      color,
      border:       `1px solid ${color}40`,
      borderRadius: 4,
      fontSize:     11,
      fontWeight:   700,
      padding:      '2px 8px',
      fontFamily:   'var(--font-head)',
    }}>
      {status}
    </span>
  )
}

// ── Sparkline ──────────────────────────────────────────────────────────
function Sparkline({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const w = 120, h = 36, pad = 3
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2)
    const y = h - pad - ((v / max) * (h - pad * 2))
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`${pad},${h - pad} ${pts} ${w - pad},${h - pad}`} fill="var(--orange)" fillOpacity="0.08" stroke="none"/>
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const [tab, setTab] = useState('pricing')

  // ── Pricing state ────────────────────────────────────────────────
  const [prices,   setPrices]   = useState({})
  const [tiers,    setTiers]    = useState([])
  const [saving,   setSaving]   = useState(false)
  const [pricingLoaded, setPricingLoaded] = useState(false)

  // ── Analytics state ──────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // ── Load pricing ─────────────────────────────────────────────────
  useEffect(() => {
    api.get('/admin/pricing', { headers: adminHeaders() })
      .then(res => {
        setPrices(res.data.unit_prices ?? {})
        setTiers(res.data.discount_tiers ?? [])
        setPricingLoaded(true)
      })
      .catch(() => toast.error('Failed to load pricing'))
  }, [])

  // ── Load analytics ────────────────────────────────────────────────
  const loadAnalytics = useCallback(() => {
    setAnalyticsLoading(true)
    api.get('/admin/analytics', { headers: adminHeaders() })
      .then(res => setAnalytics(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setAnalyticsLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics()
  }, [tab, loadAnalytics])

  // ── Save pricing ──────────────────────────────────────────────────
  const savePricing = async () => {
    setSaving(true)
    try {
      const numericPrices = {}
      for (const [k, v] of Object.entries(prices)) {
        numericPrices[k] = parseFloat(v)
      }
      await api.post('/admin/pricing',
        { unit_prices: numericPrices, discount_tiers: tiers },
        { headers: adminHeaders() }
      )
      toast.success('Prices saved successfully')
    } catch {
      toast.error('Failed to save prices')
    } finally {
      setSaving(false)
    }
  }

  const updateTier = (idx, field, value) => {
    const next = [...tiers]
    next[idx]  = { ...next[idx], [field]: parseFloat(value) || 0 }
    setTiers(next)
  }

  const addTier = () => {
    setTiers([...tiers, { min_qty: 0, discount_pct: 0 }])
  }

  const removeTier = (idx) => {
    setTiers(tiers.filter((_, i) => i !== idx))
  }

  const tabs = [
    { key: 'pricing',   label: 'Pricing'   },
    { key: 'analytics', label: 'Analytics' },
  ]

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        {/* ── Page title ─────────────────────────────── */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   24,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-head)',
            fontSize:   22,
            fontWeight: 800,
          }}>
            Admin Panel
          </h1>
         <button
  className="btn btn-secondary"
  style={{ fontSize: 12 }}
  onClick={() => {
    localStorage.removeItem('solar_admin_token')
    navigate('/admin/login')
  }}
>
  Sign out
</button>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div style={{
          display:      'flex',
          borderBottom: '1.5px solid var(--grey-3)',
          marginBottom: 24,
          gap:          0,
        }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding:      '10px 24px',
                background:   'transparent',
                border:       'none',
                borderBottom: tab === key
                  ? '2.5px solid var(--orange)'
                  : '2.5px solid transparent',
                color:        tab === key ? 'var(--orange)' : 'var(--grey-6)',
                fontFamily:   'var(--font-head)',
                fontWeight:   700,
                fontSize:     12,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor:       'pointer',
                marginBottom: -1.5,
                transition:   'all 0.18s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            PRICING TAB
        ══════════════════════════════════════════════ */}
        {tab === 'pricing' && (
          <>
            {/* ── Article prices ─────────────────────── */}
            <div className="card">
              <div className="card-title">Article Prices</div>
              <p style={{ fontSize: 12, color: 'var(--grey-5)', marginBottom: 20 }}>
                Changes take effect immediately — no restart required.
              </p>

              {!pricingLoaded ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div className="spinner"/>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--grey-3)' }}>
                      <th style={thStyle}>Article</th>
                      <th style={thStyle}>Description</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>
                        Unit price (€)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prices).map(([article, price], i) => (
                      <tr key={article} style={{
                        background: i % 2 === 0 ? 'var(--grey-1)' : 'var(--white)',
                      }}>
                        <td style={tdStyle}>
                          <code style={{ fontSize: 11, color: 'var(--grey-5)' }}>
                            {article}
                          </code>
                        </td>
                        <td style={tdStyle}>
                          {ARTICLE_LABELS[article] ?? article}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={e => setPrices({
                              ...prices,
                              [article]: e.target.value,
                            })}
                            style={{
                              width:         90,
                              padding:       '5px 8px',
                              border:        '1.5px solid var(--grey-3)',
                              borderRadius:  'var(--radius)',
                              fontSize:      13,
                              textAlign:     'right',
                              fontFamily:    'var(--font-body)',
                              outline:       'none',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                            onBlur={e  => e.target.style.borderColor = 'var(--grey-3)'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Discount tiers ──────────────────────── */}
            <div className="card">
              <div className="card-title">Volume Discount Tiers</div>
              <p style={{ fontSize: 12, color: 'var(--grey-5)', marginBottom: 20 }}>
                Tiers are evaluated by total quantity across all articles.
                Highest matching tier wins.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--grey-3)' }}>
                    <th style={thStyle}>Min quantity</th>
                    <th style={thStyle}>Discount %</th>
                    <th style={{ ...thStyle, width: 40 }}/>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier, idx) => (
                    <tr key={idx} style={{
                      background: idx % 2 === 0 ? 'var(--grey-1)' : 'var(--white)',
                    }}>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="0"
                          value={tier.min_qty}
                          onChange={e => updateTier(idx, 'min_qty', e.target.value)}
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                          onBlur={e  => e.target.style.borderColor = 'var(--grey-3)'}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={tier.discount_pct}
                          onChange={e => updateTier(idx, 'discount_pct', e.target.value)}
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                          onBlur={e  => e.target.style.borderColor = 'var(--grey-3)'}
                        />
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeTier(idx)}
                          style={{
                            background:   'transparent',
                            border:       'none',
                            cursor:       'pointer',
                            color:        '#d32f2f',
                            fontSize:     18,
                            lineHeight:   1,
                            padding:      '0 4px',
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                className="btn btn-secondary"
                style={{ fontSize: 12 }}
                onClick={addTier}
              >
                + Add tier
              </button>
            </div>

            {/* ── Save button ─────────────────────────── */}
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={savePricing}
                disabled={saving || !pricingLoaded}
              >
                {saving ? 'Saving…' : 'Save prices'}
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            ANALYTICS TAB
        ══════════════════════════════════════════════ */}
        {tab === 'analytics' && (
          <>
            {analyticsLoading || !analytics ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <div className="spinner"/>
              </div>
            ) : (
              <>
                {/* ── Stat cards ────────────────────── */}
                <div className="admin-stats" style={{
                  display:               'grid',
                  gridTemplateColumns:   'repeat(4, 1fr)',
                  gap:                   16,
                  marginBottom:          24,
                }}>
                  <StatCard
                    label="Total users"
                    value={analytics.users.total}
                    sub={`+${analytics.users.last7d} this week`}
                    accent
                  />
                  <StatCard
                    label="Total projects"
                    value={analytics.projects.total}
                    sub={`+${analytics.projects.last7d} this week`}
                  />
                  <StatCard
                    label="Total offers"
                    value={analytics.offers.total}
                  />
                  <StatCard
                    label="Jobs completed"
                    value={analytics.jobs.stats?.find(s => s.status === 'completed')?.total ?? 0}
                    sub={`avg ${analytics.jobs.stats?.find(s => s.status === 'completed')?.avg_ms ?? 0}ms`}
                  />
                </div>

                {/* ── Activity + countries ──────────── */}
                <div className="admin-charts" style={{
                  display:             'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap:                 16,
                  marginBottom:        24,
                }}>
                  {/* Activity sparkline */}
                  <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>
                      Project activity — last 14 days
                    </div>
                    <Sparkline data={analytics.activity.map(a => a.count)}/>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      fontSize:       10,
                      color:          'var(--grey-5)',
                      marginTop:      4,
                    }}>
                      <span>
                        {analytics.activity[0]?.day
                          ? new Date(analytics.activity[0].day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : ''}
                      </span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Projects by country */}
                  <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>
                      Projects by country
                    </div>
                    {analytics.projects.byCountry.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--grey-5)' }}>No data yet</p>
                    ) : (
                      analytics.projects.byCountry.map(row => {
                        const max = analytics.projects.byCountry[0]?.count ?? 1
                        return (
                          <div key={row.country} style={{
                            display:     'flex',
                            alignItems:  'center',
                            gap:         8,
                            marginBottom: 8,
                          }}>
                            <span style={{
                              width:      28,
                              fontSize:   11,
                              fontWeight: 700,
                              color:      'var(--grey-6)',
                              flexShrink: 0,
                            }}>
                              {row.country}
                            </span>
                            <div style={{
                              flex:          1,
                              height:        8,
                              background:    'var(--grey-2)',
                              borderRadius:  99,
                              overflow:      'hidden',
                            }}>
                              <div style={{
                                width:        `${(row.count / max) * 100}%`,
                                height:       '100%',
                                background:   'var(--orange)',
                                borderRadius: 99,
                                transition:   'width 0.4s ease',
                              }}/>
                            </div>
                            <span style={{
                              fontSize:   11,
                              color:      'var(--grey-5)',
                              flexShrink: 0,
                              minWidth:   20,
                              textAlign:  'right',
                            }}>
                              {row.count}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* ── Recent jobs ───────────────────── */}
                <div className="card">
                  <div className="card-title">Recent jobs</div>
                  {!analytics.jobs.recent?.length ? (
                    <p style={{ fontSize: 12, color: 'var(--grey-5)' }}>No jobs yet</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--grey-3)' }}>
                          <th style={thStyle}>Offer ref</th>
                          <th style={thStyle}>Email</th>
                          <th style={thStyle}>Status</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Duration</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Queued at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.jobs.recent.map((job, i) => (
                          <tr key={job.id} style={{
                            background: i % 2 === 0 ? 'var(--grey-1)' : 'var(--white)',
                          }}>
                            <td style={tdStyle}>
                              <code style={{ fontSize: 11 }}>{job.offer_ref ?? '—'}</code>
                            </td>
                            <td style={tdStyle}>{job.user_email ?? '—'}</td>
                            <td style={tdStyle}>
                              <StatusBadge status={job.status}/>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              {job.duration_ms ? `${job.duration_ms}ms` : '—'}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                              {job.queued_at
                                ? new Date(job.queued_at).toLocaleDateString('en-GB', {
                                    day:    '2-digit',
                                    month:  'short',
                                    hour:   '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ── Refresh button ────────────────── */}
                <div className="btn-row">
                  <button
                    className="btn btn-secondary"
                    onClick={loadAnalytics}
                    disabled={analyticsLoading}
                    style={{ fontSize: 12 }}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </AppShell>
  )
}

const thStyle = {
  padding:       '8px 10px',
  textAlign:     'left',
  fontWeight:    700,
  fontSize:      11,
  color:         'var(--grey-5)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  fontFamily:    'var(--font-head)',
}

const tdStyle = {
  padding:      '8px 10px',
  borderBottom: '1px solid var(--grey-2)',
  color:        'var(--black)',
  fontSize:     13,
}

const inputStyle = {
  width:        80,
  padding:      '5px 8px',
  border:       '1.5px solid var(--grey-3)',
  borderRadius: 'var(--radius)',
  fontSize:     13,
  fontFamily:   'var(--font-body)',
  outline:      'none',
}