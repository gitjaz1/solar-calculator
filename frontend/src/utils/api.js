import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('solar_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('solar_token')
      sessionStorage.removeItem('solar_user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export function generateOffer(payload) {
  return api.post('/offer/generate', payload)
}

export default api