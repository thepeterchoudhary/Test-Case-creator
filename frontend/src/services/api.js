import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to the Railway backend URL.
// In local dev, it's empty and Vite's proxy forwards /api → localhost:8000.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 120000,   // 2 min – AI calls can be slow
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(msg))
  }
)

/**
 * Resolve a file path returned by the backend (e.g. "/outputs/foo.xlsx")
 * to a full URL that works both locally and in production.
 */
export function resolveFileUrl(path) {
  if (!path) return ''
  const backendOrigin = import.meta.env.VITE_API_URL || ''
  // path is already absolute like "/outputs/foo.xlsx"
  return `${backendOrigin}${path}`
}

api.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(msg))
  }
)

// ── File Upload ────────────────────────────────────────────────────────────
export async function uploadFiles(files) {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const { data } = await api.post('/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.uploaded   // [{original_name, server_path, size_bytes}]
}

// ── Generate Test Cases ────────────────────────────────────────────────────
export async function generateTestCases(payload) {
  const { data } = await api.post('/generate/', payload)
  return data   // {test_cases, summary, excel_file}
}

// ── Review Test Cases ──────────────────────────────────────────────────────
export async function reviewTestCases(payload) {
  const { data } = await api.post('/review/', payload)
  return data   // {reviewed_test_cases, review_summary, excel_file}
}

// ── Sign-Off ───────────────────────────────────────────────────────────────
export async function generateSignoff(payload) {
  const { data } = await api.post('/signoff/', payload)
  return data   // {signoff_text, excel_file}
}

// ── Health Check ───────────────────────────────────────────────────────────
export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}
