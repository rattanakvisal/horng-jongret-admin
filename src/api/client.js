import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || {}
  }
}

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toLowerCase()
  const isFormData = options.body instanceof FormData

  try {
    const response = await http.request({
      url: path,
      method,
      data: options.body,
      headers: {
        ...(isFormData ? {} : options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
    return response.data
  } catch (error) {
    const data = error.response?.data || {}
    throw new ApiError(data.message || 'Request failed', {
      status: error.response?.status,
      errors: data.errors,
    })
  }
}

export default http
