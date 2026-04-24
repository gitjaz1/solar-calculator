import React from 'react'
import { useState, useEffect } from 'react'
import api from '../utils/api.js'

// ── Skeleton loader ────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 14, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, ...style }}
    />
  )
}

// ── Card skeleton ──────────────────────────────────────────────────────
export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? '60%' : i % 2 === 0 ? '80%' : '90%'}
          height={i === 0 ? 18 : 13}
          style={{ marginBottom: i === 0 ? 16 : 10 }}
        />
      ))}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────
export function EmptyState({ icon = '☀️', message, ctaLabel, onCta }) {
  return (
    <div style={{
      textAlign:  'center',
      padding:    '48px 24px',
      color:      'var(--grey-5)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontSize: 14, marginBottom: ctaLabel ? 20 : 0 }}>
        {message}
      </p>
      {ctaLabel && onCta && (
        <button className="btn btn-primary" onClick={onCta}>
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

// ── Service banner ─────────────────────────────────────────────────────
// Shows a warning bar at the top if the backend is unreachable
export function ServiceBanner() {
  const [degraded, setDegraded] = useState(false)

  useEffect(() => {
    api.get('/health')
      .then(() => setDegraded(false))
      .catch(() => setDegraded(true))
  }, [])

  if (!degraded) return null

  return (
    <div style={{
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      zIndex:         9999,
      background:     '#d32f2f',
      color:          '#fff',
      fontSize:       13,
      fontWeight:     600,
      textAlign:      'center',
      padding:        '8px 16px',
    }}>
      ⚠ Service unavailable — please try again shortly
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────
export function ProgressBar({ value = 0 }) {
  return (
    <div style={{
      width:        '100%',
      height:       6,
      background:   'var(--grey-3)',
      borderRadius: 99,
      overflow:     'hidden',
      margin:       '12px 0',
    }}>
      <div style={{
        height:     '100%',
        borderRadius: 99,
        background: 'var(--orange)',
        width:      `${value}%`,
        transition: 'width 0.5s ease',
      }}/>
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

export function StatusBadge({ status }) {
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