import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './i18n/index.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ServiceBanner } from './components/UIKit.jsx'
import './styles/global.css'
import './styles/drawing.css'

if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(Sentry => {
    Sentry.init({
      dsn:              import.meta.env.VITE_SENTRY_DSN,
      environment:      import.meta.env.MODE,
      integrations:     [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.1,
      enabled:          import.meta.env.MODE === 'production',
    })
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
     <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <ServiceBanner />
          <App />
          <Toaster position="top-right" />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)