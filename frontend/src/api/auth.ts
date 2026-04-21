import { api } from '@/lib/axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    api.post('/api/auth/register', { email, password, name }),

  logout: (refresh_token: string) =>
    api.post('/api/auth/logout', { refresh_token }),

  refresh: (refresh_token: string) =>
    api.post('/api/auth/refresh', { refresh_token }),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),

  me: () => api.get('/api/auth/me'),
}
