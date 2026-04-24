import React from 'react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useStore from '../hooks/useStore.js'
import api from '../utils/api.js'

export default function AuthCallbackPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const setUser        = useStore(s => s.setUser)

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate('/?error=auth_failed', { replace: true })
      return
    }

    localStorage.setItem('solar_token', token)

    api.get('/auth/me')
      .then(res => {
        const user = res.data
        setUser(user)
        sessionStorage.setItem('solar_user', JSON.stringify(user))
        navigate('/projects', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('solar_token')
        navigate('/?error=auth_failed', { replace: true })
      })
  }, [])

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'var(--font-head)',
      fontSize:       14,
      color:          'var(--grey-6)',
    }}>
      Signing you in…
    </div>
  )
}