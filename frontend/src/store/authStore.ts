import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/axios'
import type { User } from '@/types'
import { isPro as computeIsPro } from '@/lib/utils'

interface AuthState {
  user: User | null
  access_token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isPro: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      isAuthenticated: false,
      isLoading: false,
      isPro: false,

      login: async (email, password) => {
        const { data } = await api.post('/api/auth/login', { email, password })
        localStorage.setItem('access_token', data.access_token as string)
        localStorage.setItem('refresh_token', data.refresh_token as string)
        set({
          user: data.user as User,
          access_token: data.access_token as string,
          isAuthenticated: true,
          isPro: computeIsPro(data.user as User),
        })
      },

      register: async (email, password, name) => {
        const { data } = await api.post('/api/auth/register', { email, password, name })
        localStorage.setItem('access_token', data.access_token as string)
        localStorage.setItem('refresh_token', data.refresh_token as string)
        set({
          user: data.user as User,
          access_token: data.access_token as string,
          isAuthenticated: true,
          isPro: computeIsPro(data.user as User),
        })
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          try {
            await api.post('/api/auth/logout', { refresh_token: refreshToken })
          } catch {
            // ignore errors on logout
          }
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, access_token: null, isAuthenticated: false, isPro: false })
      },

      loadUser: async () => {
        if (!get().isAuthenticated) return
        set({ isLoading: true })
        try {
          const { data } = await api.get('/api/auth/me')
          const user = data.user as User
          set({ user, isPro: computeIsPro(user), isLoading: false })
        } catch {
          set({ isLoading: false })
        }
      },

      setUser: (user) => {
        set({ user, isPro: computeIsPro(user) })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        isAuthenticated: state.isAuthenticated,
        isPro: state.isPro,
      }),
    }
  )
)
