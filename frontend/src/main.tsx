import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { router } from './router'
import { useAuthStore } from './store/authStore'

// Pre-load user profile if already authenticated
const { isAuthenticated, loadUser } = useAuthStore.getState()
if (isAuthenticated) loadUser()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontFamily: 'Lato, sans-serif',
          borderRadius: '12px',
        },
      }}
    />
  </StrictMode>,
)
