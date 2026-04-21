import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/shared/Sidebar'

// Auth pages
import Login from '@/pages/auth/Login'
import Cadastro from '@/pages/auth/Cadastro'
import EsqueciSenha from '@/pages/auth/EsqueciSenha'
import RedefinirSenha from '@/pages/auth/RedefinirSenha'

// App pages
import Dashboard from '@/pages/Dashboard'
import Biblioteca from '@/pages/Biblioteca'
import AdicionarLivro from '@/pages/AdicionarLivro'
import QueroLer from '@/pages/QueroLer'
import Rastreador from '@/pages/Rastreador'
import Series from '@/pages/Series'
import Trilogias from '@/pages/Trilogias'
import NaoTerminados from '@/pages/NaoTerminados'
import FavoritosLivros from '@/pages/FavoritosLivros'
import FavoritosAutores from '@/pages/FavoritosAutores'
import FavoritosCitacoes from '@/pages/FavoritosCitacoes'
import Desafios from '@/pages/Desafios'
import Bingo from '@/pages/Bingo'
import VisionBoard from '@/pages/VisionBoard'
import Estatisticas from '@/pages/Estatisticas'
import Assinatura from '@/pages/Assinatura'
import Configuracoes from '@/pages/Configuracoes'
import BookReview from '@/pages/BookReview'

function PrivateRoute() {
  const { isAuthenticated, loadUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) loadUser()
  }, [isAuthenticated, loadUser])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#FAF7F2]">
      <Sidebar />
      <main className="flex-1 lg:overflow-y-auto pt-[56px] lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}

function PublicRoute() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/cadastro', element: <Cadastro /> },
      { path: '/esqueci-senha', element: <EsqueciSenha /> },
      { path: '/redefinir-senha', element: <RedefinirSenha /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/biblioteca', element: <Biblioteca /> },
          { path: '/biblioteca/:id', element: <BookReview /> },
          { path: '/adicionar', element: <AdicionarLivro /> },
          { path: '/quero-ler', element: <QueroLer /> },
          { path: '/rastreador', element: <Rastreador /> },
          { path: '/series', element: <Series /> },
          { path: '/trilogias', element: <Trilogias /> },
          { path: '/nao-terminados', element: <NaoTerminados /> },
          { path: '/favoritos/livros', element: <FavoritosLivros /> },
          { path: '/favoritos/autores', element: <FavoritosAutores /> },
          { path: '/favoritos/citacoes', element: <FavoritosCitacoes /> },
          { path: '/desafios', element: <Desafios /> },
          { path: '/bingo', element: <Bingo /> },
          { path: '/vision-board', element: <VisionBoard /> },
          { path: '/estatisticas', element: <Estatisticas /> },
          { path: '/assinatura', element: <Assinatura /> },
          { path: '/configuracoes', element: <Configuracoes /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
