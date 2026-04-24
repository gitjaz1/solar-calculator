import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../utils/api.js'
import AppShell from '../components/AppShell.jsx'

export default function AdminLoginPage() {
  const navigate  = useNavigate()
  const [secret,  setSecret]  = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/admin/login', { secret })
      localStorage.setItem('solar_admin_token', res.data.token)
      navigate('/admin')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.2  }}
      >
        <div className="card" style={{ maxWidth: 400, margin: '0 auto' }}>
          <div className="card-title">Admin access</div>
          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
              {error && <span className="err">{error}</span>}
            </div>
            <div className="btn-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !secret}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Checking…' : 'Enter'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </AppShell>
  )
}