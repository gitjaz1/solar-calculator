import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { motion } from 'framer-motion'
import api from '../utils/api.js'
import AppShell from '../components/AppShell.jsx'
import useStore from '../hooks/useStore.js'

export default function RegisterPage() {
  const { t }    = useTranslation()
  const navigate = useNavigate()
  const setUser  = useStore(s => s.setUser)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/start', data)
      const { token, user } = res.data
      localStorage.setItem('solar_token', token)
      setUser(user)
      navigate('/setup')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <div className="card">
          <div className="card-title">{t('register.title')}</div>
          <p style={{ color: 'var(--grey-6)', fontSize: 13, marginBottom: 24 }}>
            {t('register.subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field-row">
              <div className="field">
                <label>
                  {t('register.companyName')}
                  <span className="req"> *</span>
                </label>
                <input
                  {...register('companyName', { required: t('errors.required') })}
                  placeholder={t('register.companyNamePlaceholder')}
                />
                {errors.companyName && (
                  <span className="err">{errors.companyName.message}</span>
                )}
              </div>
              <div className="field">
                <label>{t('register.vatNumber')}</label>
                <input
                  {...register('vatNumber')}
                  placeholder={t('register.vatNumberPlaceholder')}
                />
              </div>
            </div>

            <div className="field">
              <label>{t('register.companyAddress')}</label>
              <input
                {...register('companyAddress')}
                placeholder={t('register.companyAddressPlaceholder')}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>
                  {t('register.contactPerson')}
                  <span className="req"> *</span>
                </label>
                <input
                  {...register('contactName', { required: t('errors.required') })}
                  placeholder={t('register.contactPersonPlaceholder')}
                />
                {errors.contactName && (
                  <span className="err">{errors.contactName.message}</span>
                )}
              </div>
              <div className="field">
                <label>
                  {t('register.telephone')}
                  <span className="req"> *</span>
                </label>
                <input
                  {...register('telephone', { required: t('errors.required') })}
                  placeholder={t('register.telephonePlaceholder')}
                />
                {errors.telephone && (
                  <span className="err">{errors.telephone.message}</span>
                )}
              </div>
            </div>

            <div className="field">
              <label>
                {t('register.email')}
                <span className="req"> *</span>
              </label>
              <input
                type="email"
                {...register('email', {
                  required: t('errors.required'),
                  pattern: {
                    value:   /\S+@\S+\.\S+/,
                    message: t('register.emailInvalid'),
                  },
                })}
                placeholder={t('register.emailPlaceholder')}
              />
              {errors.email && (
                <span className="err">{errors.email.message}</span>
              )}
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label style={{
                flexDirection:  'row',
                alignItems:     'flex-start',
                gap:            10,
                cursor:         'pointer',
                textTransform:  'none',
                fontSize:       13,
                fontWeight:     400,
                letterSpacing:  0,
                display:        'flex',
              }}>
                <input
                  type="checkbox"
                  {...register('gdprConsent', {
                    required: t('register.gdprRequired'),
                  })}
                  style={{
                    marginTop:   2,
                    accentColor: 'var(--orange)',
                    flexShrink:  0,
                  }}
                />
                <span>
                  <Trans
                    i18nKey="register.gdprConsent"
                    components={{
                      privacyLink: (
                        <Link
                          to="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--orange)', textDecoration: 'underline' }}
                        />
                      ),
                    }}
                  />
                </span>
              </label>
              {errors.gdprConsent && (
                <span className="err">{errors.gdprConsent.message}</span>
              )}
            </div>

            <div className="btn-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              >
                {isSubmitting ? 'Starting…' : 'Start calculation'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AppShell>
  )
}