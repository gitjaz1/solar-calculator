import React from 'react'
const COLOURS = {
  0: { bg: 'var(--grey-1)',            text: 'var(--grey-4)',  border: 'var(--grey-3)'  },
  1: { bg: 'rgba(232,82,26,0.13)',     text: 'var(--orange)',  border: 'var(--orange)'  },
  2: { bg: 'rgba(232,82,26,0.30)',     text: '#c4421a',        border: '#c4421a'        },
  3: { bg: 'rgba(232,82,26,0.52)',     text: '#ffffff',        border: '#c4421a'        },
  4: { bg: 'rgba(232,82,26,0.75)',     text: '#ffffff',        border: '#a33216'        },
  5: { bg: 'rgba(232,82,26,0.95)',     text: '#ffffff',        border: '#8a2a12'        },
}
function cellStyle(tiles) {
  const c = COLOURS[Math.min(tiles, 5)] ?? COLOURS[5]
  return {
    width:        40,
    height:       40,
    background:   c.bg,
    border:       `1px solid ${c.border}`,
    borderRadius: 4,
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    fontSize:     12,
    fontWeight:   700,
    color:        c.text,
    flexShrink:   0,
  }
}

export default function BallastPlanGrid({ ballastGrid, tileThickness }) {
  if (!ballastGrid?.length) return null

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block' }}>
          {ballastGrid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
              {row.map((tiles, c) => (
                <div key={c} style={cellStyle(tiles)}>
                  {tiles > 0 ? tiles : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────── */}
     <div style={{
        display:   'flex',
        gap:       12,
        marginTop: 10,
        flexWrap:  'wrap',
        fontSize:  11,
        color:     'var(--grey-5)',
      }}>
        {Object.entries(COLOURS).filter(([k]) => k !== '0').map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width:        14,
              height:       14,
              background:   c.bg,
              border:       `1px solid ${c.border}`,
              borderRadius: 3,
            }}/>
            <span>{k} tile{k !== '1' ? 's' : ''}</span>
          </div>
        ))}
        <span style={{ marginLeft: 4 }}>× {tileThickness}mm</span>
      </div>
    </div>
  )
}
