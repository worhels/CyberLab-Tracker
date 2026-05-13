import axios from 'axios'

export const TOKEN_KEY = 'cyberlab_token'
export const AUTH_LOGOUT_EVENT = 'cyberlab:logout'

export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
    }
    return Promise.reject(error)
  },
)
