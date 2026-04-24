import React from 'react'
import { useTranslation } from 'react-i18next'

const CAT_CONFIG = {
  '0':   { color: '#1565c0', bg: '#ddeeff', labelKey: 'terrain.cat0Label',   nameKey: 'terrain.cat0Name',   descKey: 'terrain.cat0Desc'   },
  'I':   { color: '#33691e', bg: '#f1f8e9', labelKey: 'terrain.catILabel',   nameKey: 'terrain.catIName',   descKey: 'terrain.catIDesc'   },
  'II':  { color: '#558b2f', bg: '#dcedc8', labelKey: 'terrain.catIILabel',  nameKey: 'terrain.catIIName',  descKey: 'terrain.catIIDesc'  },
  'III': { color: '#827717', bg: '#f9fbe7', labelKey: 'terrain.catIIILabel', nameKey: 'terrain.catIIIName', descKey: 'terrain.catIIIDesc' },
  'IV':  { color: '#4a148c', bg: '#ede7f6', labelKey: 'terrain.catIVLabel',  nameKey: 'terrain.catIVName',  descKey: 'terrain.catIVDesc'  },
}

const CATEGORY_IDS = ['0', 'I', 'II', 'III', 'IV']

function TerrainScene({ id }) {
  switch (id) {
    case '0': return (
      <>
        <rect x="0" y="20" width="80" height="16" fill="#bbdefb" opacity="0.6"/>
        <path d="M0,28 Q10,24 20,28 Q30,32 40,28 Q50,24 60,28 Q70,32 80,28" fill="none" stroke="#1565c0" strokeWidth="1.2"/>
        <path d="M0,33 Q10,29 20,33 Q30,37 40,33 Q50,29 60,33 Q70,37 80,33" fill="none" stroke="#1565c0" strokeWidth="1.2"/>
      </>
    )
    case 'I': return (
      <rect x="0" y="30" width="80" height="6" fill="#d5c181" opacity="0.5"/>
    )
    case 'II': return (
      <>
        <rect x="0" y="32" width="80" height="4" fill="#da9836" opacity="0.5"/>
        <ellipse cx="14" cy="30" rx="7" ry="5" fill="#da9836"/>
        <ellipse cx="38" cy="28" rx="9" ry="7" fill="#da9836"/>
        <ellipse cx="62" cy="30" rx="7" ry="5" fill="#da9836"/>
      </>
    )
    case 'III': return (
      <>
        <rect x="0" y="32" width="80" height="4" fill="#da9836" opacity="0.4"/>
        <rect x="10" y="22" width="3" height="14" fill="#795548"/>
        <polygon points="11.5,10 5,24 18,24" fill="#da9836"/>
        <rect x="32" y="24" width="3" height="12" fill="#795548"/>
        <polygon points="33.5,14 27,26 40,26" fill="#da9836"/>
        <rect x="56" y="22" width="3" height="14" fill="#795548"/>
        <polygon points="57.5,11 51,25 64,25" fill="#da9836"/>
      </>
    )
    case 'IV': return (
      <>
        <rect x="4"  y="20" width="14" height="16" fill="#9e9e9e" stroke="#757575" strokeWidth="0.5"/>
        <rect x="22" y="14" width="16" height="22" fill="#bdbdbd" stroke="#757575" strokeWidth="0.5"/>
        <rect x="42" y="18" width="14" height="18" fill="#9e9e9e" stroke="#757575" strokeWidth="0.5"/>
        <rect x="60" y="22" width="16" height="14" fill="#bdbdbd" stroke="#757575" strokeWidth="0.5"/>
      </>
    )
    default: return null
  }
}

export default function TerrainIllustration({ selected }) {
  const { t } = useTranslation()

  return (
    <div style={{ marginTop: 12, marginBottom: 8 }}>
      <div style={{
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color:         'var(--grey-6)',
        marginBottom:  8,
        fontFamily:    'var(--font-head)',
      }}>
        {t('terrain.title')}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORY_IDS.map(id => {
          const cfg        = CAT_CONFIG[id]
          const isSelected = selected === id
          return (
            <div key={id} style={{
              flex:          '1 1 100px',
              background:    isSelected ? cfg.bg : '#fafafa',
              border:        `2px solid ${isSelected ? cfg.color : '#e0e0e0'}`,
              borderRadius:  6,
              padding:       '10px 10px 8px',
              transition:    'all 0.15s',
            }}>
              <svg viewBox="0 0 80 44" width="100%" height="44" xmlns="http://www.w3.org/2000/svg">
                <TerrainScene id={id}/>
                <line x1="0" y1="36" x2="80" y2="36" stroke="#795548" strokeWidth="1" strokeDasharray="3,2"/>
              </svg>

              <div style={{
                fontWeight:  700,
                fontSize:    12,
                color:       cfg.color,
                marginTop:   4,
                fontFamily:  'var(--font-head)',
              }}>
                {t(cfg.labelKey)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--black)', marginBottom: 2 }}>
                {t(cfg.nameKey)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--grey-6)', lineHeight: 1.4 }}>
                {t(cfg.descKey)}
              </div>
              {isSelected && (
                <div style={{
                  marginTop:     6,
                  fontSize:      10,
                  fontWeight:    700,
                  color:         cfg.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  fontFamily:    'var(--font-head)',
                }}>
                  ✓ selected
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 10, color: 'var(--grey-6)', marginTop: 6 }}>
        {t('terrain.reference')}
      </div>
    </div>
  )
}