import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // ── User ──────────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ── Project ───────────────────────────────────────
      project: {
        name:               '',
        reference:          '',
        country:            '',
        panelThickness:     30,
        panelLength:        2000,
        consequenceClass:   'CC2',
        designWorkingLife:  '>1year',
        basicWindVelocity:  24,
        terrainCategory:    'II',
        tileThickness:      40,
      },
      setProject: (fields) =>
        set((s) => ({ project: { ...s.project, ...fields } })),

      // ── Zones ─────────────────────────────────────────
      zones:        [],
      activeZoneIdx: 0,

      addZone: () => set((s) => ({
        zones: [
          ...s.zones,
          {
            id:    Date.now(),
            label: `Zone ${s.zones.length + 1}`,
            rows:  3,
            cols:  3,
            grid:  Array.from({ length: 3 }, () => Array(3).fill(true)),
          },
        ],
        activeZoneIdx: s.zones.length,
      })),

      removeZone: (idx) => set((s) => ({
        zones:        s.zones.filter((_, i) => i !== idx),
        activeZoneIdx: Math.max(0, s.activeZoneIdx - 1),
      })),

      setActiveZone: (idx) => set({ activeZoneIdx: idx }),

      updateZoneGrid: (idx, grid) => set((s) => {
        const zones = [...s.zones]
        zones[idx]  = {
          ...zones[idx],
          grid,
          rows: grid.length,
          cols: grid[0]?.length ?? 0,
        }
        return { zones }
      }),

      updateZoneSize: (idx, rows, cols) => set((s) => {
        const zones    = [...s.zones]
        const oldGrid  = zones[idx].grid
        const newGrid  = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) =>
            oldGrid[r]?.[c] ?? true
          )
        )
        zones[idx] = { ...zones[idx], rows, cols, grid: newGrid }
        return { zones }
      }),

      // ── Calc result ───────────────────────────────────
      calcResult: null,
      setCalcResult: (r) => set({ calcResult: r }),

      // ── Reset ─────────────────────────────────────────
      reset: () => {
        try { sessionStorage.removeItem('solar_user') } catch (_) {}
        try { localStorage.removeItem('solar_token')  } catch (_) {}
        set({
          user:    null,
          project: {
            name:              '',
            reference:         '',
            country:           '',
            panelThickness:    30,
            panelLength:       2000,
            consequenceClass:  'CC2',
            designWorkingLife: '>1year',
            basicWindVelocity: 24,
            terrainCategory:   'II',
            tileThickness:     40,
          },
          zones:         [],
          activeZoneIdx: 0,
          calcResult:    null,
        })
      },
    }),
    {
      name:       'solar-store',
      partialize: (s) => ({
        user:       s.user,
        project:    s.project,
        zones:      s.zones,
        calcResult: s.calcResult,
      }),
    }
  )
)

export default useStore