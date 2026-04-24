import { useState, useEffect, useRef } from 'react'
import api from '../utils/api.js'

const POLL_INTERVAL = 2000
const MAX_POLLS     = 120

export default function useJobPoller(jobId, retryKey = 0) {
  const [status,   setStatus]   = useState('queued')
  const [progress, setProgress] = useState(0)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)

  const pollCount = useRef(0)
  const timer     = useRef(null)

  useEffect(() => {
    if (!jobId) return

    pollCount.current = 0
    setStatus('queued')
    setProgress(0)
    setResult(null)
    setError(null)

    async function poll() {
      try {
        const res  = await api.get(`/offer/status/${jobId}`)
        const data = res.data

        setStatus(data.status)
        setProgress(data.progress ?? 0)

        if (data.status === 'completed') {
          setResult(data.result)
          return
        }

        if (data.status === 'failed') {
          setError(data.error ?? 'Job failed')
          return
        }

        pollCount.current++
        if (pollCount.current >= MAX_POLLS) {
          setError('Timed out waiting for offer generation')
          return
        }

        timer.current = setTimeout(poll, POLL_INTERVAL)
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to check job status')
      }
    }

    timer.current = setTimeout(poll, POLL_INTERVAL)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [jobId, retryKey])

  return { status, progress, result, error }
}