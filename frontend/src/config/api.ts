// Central Backend API configuration
const rawUrl =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env as unknown as Record<string, string>)['backend_url'] ||
  'https://restaurant-1-c1qn.onrender.com'

export const BACKEND_URL = String(rawUrl).trim().replace(/\/+$/, '')
