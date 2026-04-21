import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, isAuthenticated, isPro, login, register, logout, loadUser, isLoading } = useAuthStore()
  return { user, isAuthenticated, isPro, login, register, logout, loadUser, isLoading }
}
