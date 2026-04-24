const router = require('express').Router()
const db     = require('../services/db')
const logger = require('../services/logger')
const { verifyToken } = require('../middleware/auth')
const { projectSaveValidators, validate } = require('../middleware/validate')

// ── GET /projects ─────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         p.id, p.name, p.reference, p.country,
         p.panel_thickness, p.panel_length,
         p.consequence_class, p.design_working_life,
         p.basic_wind_velocity, p.terrain_category,
         p.tile_thickness, p.zones, p.calc_result,
         p.offer_ref, p.created_at, p.updated_at,
         u.email      AS user_email,
         u.company_name,
         u.contact_name,
         (SELECT SUM((z->>'shelters')::int)
          FROM jsonb_array_elements(p.calc_result->'zones') z
         ) AS shelters
       FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC`,
      [req.user.userId]
    )
    res.json(result.rows)
  } catch (err) { next(err) }
})

// ── GET /projects/:id ─────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    )
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Project not found' })
    }
    res.json(result.rows[0])
  } catch (err) { next(err) }
})

// ── POST /projects ────────────────────────────────────────────────────
router.post('/', verifyToken, projectSaveValidators, validate, async (req, res, next) => {
  try {
    const {
      name, reference, country,
      panelThickness, panelLength,
      consequenceClass, designWorkingLife,
      basicWindVelocity, terrainCategory,
      tileThickness, zones, calcResult,
    } = req.body

    const result = await db.query(
      `INSERT INTO projects
         (user_id, name, reference, country,
          panel_thickness, panel_length,
          consequence_class, design_working_life,
          basic_wind_velocity, terrain_category,
          tile_thickness, zones, calc_result)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.userId, name, reference ?? null, country,
        panelThickness, panelLength ?? 2000,
        consequenceClass, designWorkingLife,
        basicWindVelocity, terrainCategory,
        tileThickness,
        JSON.stringify(zones ?? []),
        calcResult ? JSON.stringify(calcResult) : null,
      ]
    )

    logger.info('project_created', {
      userId:    req.user.userId,
      projectId: result.rows[0].id,
    })

    res.status(201).json(result.rows[0])
  } catch (err) { next(err) }
})

// ── PUT /projects/:id ─────────────────────────────────────────────────
router.put('/:id', verifyToken, projectSaveValidators, validate, async (req, res, next) => {
  try {
    const {
      name, reference, country,
      panelThickness, panelLength,
      consequenceClass, designWorkingLife,
      basicWindVelocity, terrainCategory,
      tileThickness, zones, calcResult,
    } = req.body

    const existing = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    )
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const result = await db.query(
      `UPDATE projects SET
         name                = $1,
         reference           = $2,
         country             = $3,
         panel_thickness     = $4,
         panel_length        = $5,
         consequence_class   = $6,
         design_working_life = $7,
         basic_wind_velocity = $8,
         terrain_category    = $9,
         tile_thickness      = $10,
         zones               = $11,
         calc_result         = $12,
         updated_at          = NOW()
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        name, reference ?? null, country,
        panelThickness, panelLength ?? 2000,
        consequenceClass, designWorkingLife,
        basicWindVelocity, terrainCategory,
        tileThickness,
        JSON.stringify(zones ?? []),
        calcResult ? JSON.stringify(calcResult) : null,
        req.params.id, req.user.userId,
      ]
    )

    logger.info('project_updated', {
      userId:    req.user.userId,
      projectId: req.params.id,
    })

    res.json(result.rows[0])
  } catch (err) { next(err) }
})

// ── DELETE /projects/:id ──────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    )
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Project not found' })
    }

    logger.info('project_deleted', {
      userId:    req.user.userId,
      projectId: req.params.id,
    })

    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router