import React from 'react'
import { useTranslation } from 'react-i18next'

export default function OfferSummary({ bom, subtotal, discountPct, discountAmount, totalPrice }) {
  const { t } = useTranslation()

  const rows = Object.entries(bom ?? {}).map(([article, item]) => ({
    article,
    ...item,
  }))

  return (
    <div>
      {/* ── Desktop table ──────────────────────────── */}
      <div className="bom-desktop">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--grey-3)' }}>
              <th style={thStyle}>Article</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Unit price</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Line total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.article}
                style={{ background: i % 2 === 0 ? 'var(--grey-1)' : 'var(--white)' }}
              >
                <td style={tdStyle}>
                  <code style={{ fontSize: 11, color: 'var(--grey-5)' }}>
                    {row.article}
                  </code>
                </td>
                <td style={tdStyle}>{row.description}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{row.qty}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  € {(row.unit_price ?? 0).toFixed(2)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                  € {(row.line_total ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ───────────────────────────── */}
      <div className="bom-mobile">
        {rows.map((row, i) => (
          <div key={row.article} style={{
            padding:      '12px 0',
            borderBottom: '1px solid var(--grey-2)',
          }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'flex-start',
              marginBottom:   4,
            }}>
              <div style={{ flex: 1, paddingRight: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)', marginBottom: 2 }}>
                  {row.description}
                </div>
                <code style={{ fontSize: 10, color: 'var(--grey-5)' }}>
                  {row.article}
                </code>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>
                  € {(row.line_total ?? 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey-5)' }}>
                  {row.qty} × € {(row.unit_price ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Totals ─────────────────────────────────── */}
      <div style={{
        marginTop:     12,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-end',
        gap:           4,
        fontSize:      13,
      }}>
        <div style={{ color: 'var(--grey-6)' }}>
          Subtotal: <strong>€ {(subtotal ?? 0).toFixed(2)}</strong>
        </div>
        {discountPct > 0 && (
          <div style={{ color: '#2e7d32' }}>
            Discount ({discountPct}%): <strong>− € {(discountAmount ?? 0).toFixed(2)}</strong>
          </div>
        )}
        <div style={{
          fontSize:   16,
          fontWeight: 700,
          color:      'var(--orange)',
          borderTop:  '1.5px solid var(--orange)',
          paddingTop: 8,
          marginTop:  4,
        }}>
          Total: € {(totalPrice ?? 0).toFixed(2)}
        </div>
      </div>
    </div>
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
  padding:      '7px 10px',
  borderBottom: '1px solid var(--grey-2)',
  color:        'var(--black)',
}