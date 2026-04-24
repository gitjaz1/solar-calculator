import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../hooks/useStore.js'

function cloneGrid(g) { return g.map(r => [...r]) }

export default function ZoneGrid({ zoneIdx }) {
  const { t }          = useTranslation()
  const zones          = useStore(s => s.zones)
  const updateZoneGrid = useStore(s => s.updateZoneGrid)
  const updateZoneSize = useStore(s => s.updateZoneSize)

  const zone = zones[zoneIdx]
  const [dragging,  setDragging]  = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd,   setDragEnd]   = useState(null)
  const [dragValue, setDragValue] = useState(true)
  const containerRef = useRef(null)

  if (!zone) return null

  const { grid, rows, cols } = zone

  const selectionRect = useCallback(() => {
    if (!dragStart || !dragEnd) return null
    return {
      r1: Math.min(dragStart.r, dragEnd.r),
      c1: Math.min(dragStart.c, dragEnd.c),
      r2: Math.max(dragStart.r, dragEnd.r),
      c2: Math.max(dragStart.c, dragEnd.c),
    }
  }, [dragStart, dragEnd])

  const isInSelection = useCallback((r, c) => {
    const s = selectionRect()
    return s && r >= s.r1 && r <= s.r2 && c >= s.c1 && c <= s.c2
  }, [selectionRect])

  const commitDrag = useCallback(() => {
    if (!dragging) return
    const s = selectionRect()
    if (s) {
      const next = cloneGrid(grid)
      for (let r = s.r1; r <= s.r2; r++)
        for (let c = s.c1; c <= s.c2; c++)
          next[r][c] = dragValue
      updateZoneGrid(zoneIdx, next)
    }
    setDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [dragging, dragValue, grid, zoneIdx, updateZoneGrid, selectionRect])

  const onMouseDown = (e, r, c) => {
    e.preventDefault()
    setDragging(true)
    setDragStart({ r, c })
    setDragEnd({ r, c })
    setDragValue(!grid[r][c])
  }

  const onMouseEnter = (r, c) => {
    if (dragging) setDragEnd({ r, c })
  }

  const cellFromPoint = useCallback((clientX, clientY) => {
    if (!containerRef.current) return null
    const rect  = containerRef.current.getBoundingClientRect()
    const x     = clientX - rect.left
    const y     = clientY - rect.top
    const cellW = rect.width  / cols
    const cellH = rect.height / rows
    const c     = Math.floor(x / cellW)
    const r     = Math.floor(y / cellH)
    if (r >= 0 && r < rows && c >= 0 && c < cols) return { r, c }
    return null
  }, [rows, cols])

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    const cell  = cellFromPoint(touch.clientX, touch.clientY)
    if (!cell) return
    e.preventDefault()
    setDragging(true)
    setDragStart(cell)
    setDragEnd(cell)
    setDragValue(!grid[cell.r][cell.c])
  }, [cellFromPoint, grid])

  const onTouchMove = useCallback((e) => {
    if (!dragging) return
    e.preventDefault()
    const touch = e.touches[0]
    const cell  = cellFromPoint(touch.clientX, touch.clientY)
    if (cell) setDragEnd(cell)
  }, [dragging, cellFromPoint])

  const onTouchEnd = useCallback((e) => {
    e.preventDefault()
    commitDrag()
  }, [commitDrag])

  const addRow    = () => { if (rows < 30) updateZoneSize(zoneIdx, rows + 1, cols) }
  const removeRow = () => { if (rows > 1)  updateZoneSize(zoneIdx, rows - 1, cols) }
  const addCol    = () => { if (cols < 30) updateZoneSize(zoneIdx, rows, cols + 1) }
  const removeCol = () => { if (cols > 1)  updateZoneSize(zoneIdx, rows, cols - 1) }

  const shelterCount = grid.flat().filter(Boolean).length

  return (
    <div>
      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="grid-toolbar">
        <div className="grid-axis-control">
          <span className="grid-axis-label">{t('drawing.rows')}</span>
          <button className="grid-btn" onClick={removeRow} disabled={rows <= 1}>−</button>
          <span className="grid-axis-count">{rows}</span>
          <button className="grid-btn" onClick={addRow}    disabled={rows >= 30}>+</button>
        </div>
        <div className="grid-axis-control">
          <span className="grid-axis-label">{t('drawing.cols')}</span>
          <button className="grid-btn" onClick={removeCol} disabled={cols <= 1}>−</button>
          <span className="grid-axis-count">{cols}</span>
          <button className="grid-btn" onClick={addCol}    disabled={cols >= 30}>+</button>
        </div>
        <div className="grid-stats">
          {rows} × {cols} &nbsp;·&nbsp; {shelterCount} {t('common.shelters')}
        </div>
      </div>

      {/* ── Scrollable grid ───────────────────────────── */}
      <div className="grid-scroll-wrap">
        <div
          ref={containerRef}
          className="grid-canvas"
          style={{ gridTemplateColumns: `repeat(${cols}, 36px)` }}
          onMouseLeave={commitDrag}
          onMouseUp={commitDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {grid.map((row, r) =>
            row.map((active, c) => {
              const inSel   = isInSelection(r, c)
              const preview = dragging && inSel ? dragValue : null
              const display = preview !== null ? preview : active
              let cls = 'grid-cell '
              if (dragging && inSel)
                cls += dragValue ? 'grid-cell--drag-add' : 'grid-cell--drag-remove'
              else
                cls += display ? 'grid-cell--active' : 'grid-cell--empty'
              return (
                <div
                  key={`${r}-${c}`}
                  className={cls}
                  onMouseDown={(e) => onMouseDown(e, r, c)}
                  onMouseEnter={() => onMouseEnter(r, c)}
                >
                  {display && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="5" rx="1" fill="var(--orange)" opacity="0.7"/>
                      <rect x="1" y="8" width="12" height="5" rx="1" fill="var(--orange)" opacity="0.7"/>
                    </svg>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────── */}
      <div className="grid-legend">
        <span className="grid-legend-item">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="5" rx="1" fill="var(--orange)" opacity="0.7"/>
            <rect x="1" y="8" width="12" height="5" rx="1" fill="var(--orange)" opacity="0.7"/>
          </svg>
          {t('drawing.shelterOn')}
        </span>
        <span className="grid-legend-item">
          <div style={{ width: 14, height: 14, border: '2px solid var(--grey-3)', borderRadius: 3, background: 'var(--grey-1)' }}/>
          {t('drawing.shelterOff')}
        </span>
        <span className="grid-legend-item" style={{ color: 'var(--grey-4)' }}>
          Click or drag to toggle shelters
        </span>
      </div>
    </div>
  )
}