import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'Arial, sans-serif',
          padding:        '32px',
        }}>
          <div style={{
            maxWidth:     480,
            textAlign:    'center',
            background:   '#fff',
            borderRadius: 12,
            padding:      '40px 32px',
            boxShadow:    '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              fontSize:     20,
              fontWeight:   700,
              marginBottom: 12,
              color:        '#1a1a18',
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize:     14,
              color:        '#6b6860',
              marginBottom: 24,
              lineHeight:   1.6,
            }}>
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background:   '#f0a010',
                color:        '#fff',
                border:       'none',
                borderRadius: 8,
                padding:      '10px 24px',
                fontSize:     14,
                fontWeight:   600,
                cursor:       'pointer',
              }}
            >
              Refresh page
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                marginTop:   24,
                textAlign:   'left',
                fontSize:    11,
                color:       '#d32f2f',
                background:  '#fff3f3',
                padding:     12,
                borderRadius: 6,
                overflow:    'auto',
                maxHeight:   200,
              }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}