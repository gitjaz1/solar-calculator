import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppShell from '../components/AppShell.jsx'
import CCMatrix from '../components/forms/CCMatrix.jsx'
import TerrainIllustration from '../components/forms/TerrainIllustration.jsx'
import useStore from '../hooks/useStore.js'
import useCountry, { COUNTRY_CONFIG } from '../hooks/useCountry.js'

export default function ProjectSetupPage() {
  const { t }      = useTranslation()
  const navigate   = useNavigate()
  const { project, setProject, addZone, zones } = useStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...project,
      panelThickness:    String(project.panelThickness),
      tileThickness:     String(project.tileThickness),
      basicWindVelocity: String(project.basicWindVelocity),
    },
  })

  const cc      = watch('consequenceClass', project.consequenceClass)
  const terrain = watch('terrainCategory',  project.terrainCategory)
  const country = watch('country',          project.country)

  const { windOptions } = useCountry(country)

  const onSubmit = (data) => {
    setProject({
      ...data,
      panelThickness:    Number(data.panelThickness),
      panelLength:       Number(data.panelLength),
      basicWindVelocity: Number(data.basicWindVelocity),
      tileThickness:     Number(data.tileThickness),
    })
    if (zones.length === 0) addZone()
    navigate('/draw')
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Project identity ───────────────────────── */}
          <div className="card">
            <div className="card-title">{t('setup.projectInfoTitle')}</div>

            <div className="field-row">
              <div className="field">
                <label>
                  {t('setup.projectName')}
                  <span className="req"> *</span>
                </label>
                <input
                  {...register('name', { required: t('errors.required') })}
                  placeholder={t('setup.projectNamePlaceholder')}
                />
                {errors.name && (
                  <span className="err">{errors.name.message}</span>
                )}
              </div>
              <div className="field">
                <label>{t('setup.reference')}</label>
                <input
                  {...register('reference')}
                  placeholder={t('setup.referencePlaceholder')}
                />
              </div>
            </div>

              <div className="field-row field-row-3">
                <div className="field">
                <label>
                  {t('setup.country')}
                  <span className="req"> *</span>
                </label>
                <select {...register('country', { required: t('errors.required') })}>
                  <option value="">{t('common.select')}</option>
                  {Object.entries(COUNTRY_CONFIG).map(([code, cfg]) => (
                    <option key={code} value={code}>
                      {t(`countries.${code}`, cfg.label)}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <span className="err">{errors.country.message}</span>
                )}
              </div>

              <div className="field">
                <label>
                  {t('setup.panelThickness')}
                  <span className="req"> *</span>
                </label>
                <select {...register('panelThickness')}>
                  <option value={25}>25 mm</option>
                  <option value={30}>30 mm</option>
                  <option value={35}>35 mm</option>
                </select>
                <span className="hint">{t('setup.panelThicknessHint')}</span>
              </div>

              <div className="field">
                <label>
                  {t('setup.panelLength')}
                  <span className="req"> *</span>
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2382}
                  step={1}
                  {...register('panelLength', {
                    required:     t('errors.required'),
                    min: { value: 2000, message: t('setup.panelLengthMin') },
                    max: { value: 2382, message: t('setup.panelLengthMax') },
                    valueAsNumber: true,
                  })}
                  placeholder={t('setup.panelLengthPlaceholder')}
                />
                {errors.panelLength && (
                  <span className="err">{errors.panelLength.message}</span>
                )}
                <span className="hint">{t('setup.panelLengthHint')}</span>
              </div>
            </div>
          </div>

          {/* ── Ballast parameters ─────────────────────── */}
          <div className="card">
            <div className="card-title">{t('setup.ballastParamsTitle')}</div>

            <div className="field">
              <label>
                {t('setup.consequenceClass')}
                <span className="req"> *</span>
              </label>
              <select {...register('consequenceClass')}>
                <option value="CC1">{t('setup.ccLow')}</option>
                <option value="CC2">{t('setup.ccMedium')}</option>
                <option value="CC3">{t('setup.ccHigh')}</option>
              </select>
              {cc && <CCMatrix selected={cc} />}
            </div>

            <div className="field">
              <label>
                {t('setup.designWorkingLife')}
                <span className="req"> *</span>
              </label>
              <select {...register('designWorkingLife')}>
                <option value=">1year">{t('setup.dwl1year')}</option>
                <option value=">10years">{t('setup.dwl10years')}</option>
                <option value=">25years">{t('setup.dwl25years')}</option>
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label>
                  {t('setup.basicWindVelocity')}
                  <span className="req"> *</span>
                </label>
                <select {...register('basicWindVelocity')}>
                  {windOptions.map(v => (
                    <option key={v} value={v}>
                      {v} {t('common.mmps')}
                    </option>
                  ))}
                </select>
                <span className="hint">{t('setup.windHint')}</span>
              </div>

              <div className="field">
                <label>
                  {t('setup.terrainCategory')}
                  <span className="req"> *</span>
                </label>
                <select {...register('terrainCategory')}>
                  {['0', 'I', 'II', 'III', 'IV'].map(c => (
                    <option key={c} value={c}>
                      {t('setup.terrainCategoryOption', { cat: c })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {terrain && <TerrainIllustration selected={terrain} />}

            <div className="field" style={{ maxWidth: 280, marginTop: 16 }}>
              <label>
                {t('setup.tileThickness')}
                <span className="req"> *</span>
              </label>
              <select {...register('tileThickness')}>
                <option value={40}>{t('setup.tile40')}</option>
                <option value={45}>{t('setup.tile45')}</option>
                <option value={50}>{t('setup.tile50')}</option>
              </select>
              <span className="hint">{t('setup.tileThicknessHint')}</span>
            </div>
          </div>

          <div className="btn-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              {t('nav.back')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('nav.startDrawing')}
            </button>
          </div>

        </form>
      </motion.div>
    </AppShell>
  )
}