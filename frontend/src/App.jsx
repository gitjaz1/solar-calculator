import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import RegisterPage     from './pages/RegisterPage.jsx'
import ProjectSetupPage from './pages/ProjectSetupPage.jsx'
import DrawingPage      from './pages/DrawingPage.jsx'
import ReviewPage       from './pages/ReviewPage.jsx'
import ConfirmPage      from './pages/ConfirmPage.jsx'
import PrivacyPage      from './pages/PrivacyPage.jsx'
import AdminLoginPage   from './pages/AdminLoginPage.jsx'

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))

function RequireSession({ children }) {
  const stored = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('solar-store') ?? '{}')
      return s?.state?.user ?? null
    } catch { return null }
  })()
  return stored ? children : <Navigate to="/" replace />
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('solar_admin_token')
  if (!token) return <Navigate to="/admin/login" replace />
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload?.isAdmin) return <Navigate to="/admin/login" replace />
  } catch {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<RegisterPage />} />
      <Route path="/setup"       element={<RequireSession><ProjectSetupPage /></RequireSession>} />
      <Route path="/draw"        element={<RequireSession><DrawingPage /></RequireSession>} />
      <Route path="/review"      element={<RequireSession><ReviewPage /></RequireSession>} />
      <Route path="/confirm"     element={<ConfirmPage />} />
      <Route path="/privacy"     element={<PrivacyPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin"       element={
        <RequireAdmin>
          <Suspense fallback={null}>
            <AdminPage />
          </Suspense>
        </RequireAdmin>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}