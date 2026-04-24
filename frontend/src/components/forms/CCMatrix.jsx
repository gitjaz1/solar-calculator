import React from 'react'
import { useTranslation } from 'react-i18next'

const CC_ROWS = [
  {
    cc:          'CC1',
    color:       '#2e7d32',
    bg:          '#e8f5e9',
    titleKey:    'ccMatrix.cc1Title',
    descKey:     'ccMatrix.cc1Desc',
    examplesKey: 'ccMatrix.cc1Examples',
  },
  {
    cc:          'CC2',
    color:       '#e65100',
    bg:          '#fff3e0',
    titleKey:    'ccMatrix.cc2Title',
    descKey:     'ccMatrix.cc2Desc',
    examplesKey: 'ccMatrix.cc2Examples',
  },
  {
    cc:          'CC3',
    color:       '#b71c1c',
    bg:          '#ffebee',
    titleKey:    'ccMatrix.cc3Title',
    descKey:     'ccMatrix.cc3Desc',
    examplesKey: 'ccMatrix.cc3Examples',
  },
]

export default function CCMatrix({ selected }) {
  const { t } = useTranslation()

  return (
    <div style={{ marginTop: 12, marginBottom: 8 }}>
      <div style={{
        fontSize:       10,
        fontWeight:     700,
        letterSpacing:  '0.5px',
        textTransform:  'uppercase',
        color:          'var(--grey-6)',
        marginBottom:   6,
        fontFamily:     'var(--font-head)',
      }}>
        {t('ccMatrix.title')}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--black)', color: '#fff' }}>
            <th style={th}>{t('ccMatrix.colClass')}</th>
            <th style={th}>{t('ccMatrix.colDesc')}</th>
            <th style={th}>{t('ccMatrix.colExamples')}</th>
          </tr>
        </thead>
        <tbody>
          {CC_ROWS.map(row => {
            const isSelected = selected === row.cc
            return (
              <tr
                key={row.cc}
                style={{
                  background:    isSelected ? row.bg : '#fff',
                  outline:       isSelected ? `2px solid ${row.color}` : 'none',
                  outlineOffset: -1,
                  transition:    'background 0.15s',
                }}
              >
                <td style={{ ...td, fontWeight: 700, color: row.color, whiteSpace: 'nowrap' }}>
                  {row.cc}
                  {isSelected && (
                    <span style={{
                      display:    'block',
                      fontSize:   10,
                      fontWeight: 600,
                      color:      row.color,
                      opacity:    0.8,
                    }}>
                      ✓ selected
                    </span>
                  )}
                </td>
                <td style={td}>
                  <strong style={{ display: 'block', color: 'var(--black)', marginBottom: 2 }}>
                    {t(row.titleKey)}
                  </strong>
                  {t(row.descKey)}
                </td>
                <td style={{ ...td, color: 'var(--grey-6)', fontStyle: 'italic' }}>
                  {t(row.examplesKey)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const th = {
  textAlign:     'left',
  padding:       '7px 10px',
  fontSize:      10,
  fontWeight:    600,
  letterSpacing: '0.3px',
  fontFamily:    'var(--font-head)',
}

const td = {
  padding:       '8px 10px',
  verticalAlign: 'top',
  borderBottom:  '1px solid #eee',
  lineHeight:    1.5,
}