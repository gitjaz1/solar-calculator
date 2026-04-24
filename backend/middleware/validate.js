const { body, validationResult } = require('express-validator')

function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors:  errors.array(),
    })
  }
  next()
}

const calculateValidators = [
  body('zones')
    .isArray({ min: 1 })
    .withMessage('zones must be a non-empty array'),

  body('zones.*.id')
    .isNumeric()
    .withMessage('Each zone must have a numeric id'),

  body('zones.*.label')
    .isString().notEmpty()
    .withMessage('Each zone must have a non-empty label'),

  body('zones.*.grid')
    .isArray({ min: 3, max: 30 })
    .withMessage('Each zone grid must have 3–30 rows'),

  body('zones.*.grid.*')
    .isArray({ min: 3, max: 30 })
    .withMessage('Each grid row must have 3–30 columns'),

  body('project.panelThickness')
    .isIn([25, 30, 35])
    .withMessage('panelThickness must be 25, 30 or 35'),

  body('project.consequenceClass')
    .isIn(['CC1', 'CC2', 'CC3'])
    .withMessage('consequenceClass must be CC1, CC2 or CC3'),

  body('project.basicWindVelocity')
    .isInt({ min: 20, max: 50 })
    .withMessage('basicWindVelocity must be between 20 and 50'),

  body('project.terrainCategory')
    .isIn(['0', 'I', 'II', 'III', 'IV'])
    .withMessage('terrainCategory must be 0, I, II, III or IV'),

  body('project.tileThickness')
    .isIn([40, 45, 50])
    .withMessage('tileThickness must be 40, 45 or 50'),
]

const offerValidators = [
  body('user.email')
    .isEmail()
    .withMessage('user.email must be a valid email address'),

  body('user.companyName')
    .isString().notEmpty()
    .withMessage('user.companyName is required'),

  body('user.contactName')
    .isString().notEmpty()
    .withMessage('user.contactName is required'),

  body('user.telephone')
    .isString().notEmpty()
    .withMessage('user.telephone is required'),

  body('project.name')
    .isString().notEmpty()
    .withMessage('project.name is required'),

  body('project.country')
    .isString().isLength({ min: 2, max: 2 })
    .withMessage('project.country must be a 2-letter country code'),
]

const projectSaveValidators = [
  body('name')
    .isString().notEmpty()
    .withMessage('Project name is required'),

  body('country')
    .isString().isLength({ min: 2, max: 2 })
    .withMessage('country must be a 2-letter country code'),

  body('panelThickness')
    .isIn([25, 30, 35])
    .withMessage('panelThickness must be 25, 30 or 35'),

  body('consequenceClass')
    .isIn(['CC1', 'CC2', 'CC3'])
    .withMessage('consequenceClass must be CC1, CC2 or CC3'),

  body('basicWindVelocity')
    .isInt({ min: 20, max: 50 })
    .withMessage('basicWindVelocity must be 20–50'),

  body('terrainCategory')
    .isIn(['0', 'I', 'II', 'III', 'IV'])
    .withMessage('terrainCategory must be 0, I, II, III or IV'),

  body('tileThickness')
    .isIn([40, 45, 50])
    .withMessage('tileThickness must be 40, 45 or 50'),

  body('zones')
    .isArray()
    .withMessage('zones must be an array'),
]

const registerValidators = [
  body('companyName')
    .isString().notEmpty()
    .withMessage('Company name is required'),

  body('contactName')
    .isString().notEmpty()
    .withMessage('Contact name is required'),

  body('telephone')
    .isString().notEmpty()
    .withMessage('Telephone is required'),

  body('email')
    .isEmail()
    .withMessage('A valid email is required'),
]

module.exports = {
  validate,
  calculateValidators,
  offerValidators,
  projectSaveValidators,
  registerValidators,
}