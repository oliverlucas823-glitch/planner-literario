import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Library, BookPlus, Bookmark, Activity, Layers,
  BookMarked, XCircle, Heart, Users, Quote, Trophy, Target, LayoutGrid,
  Image, BarChart2, CreditCard, Settings, Lock, Menu, X, LogOut, BookOpen,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  pro?: boolean
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Biblioteca', to: '/biblioteca', icon: Library },
      { label: 'Adicionar Livro', to: '/adicionar', icon: BookPlus },
      { label: 'Quero Ler', to: '/quero-ler', icon: Bookmark },
      { label: 'Rastreador', to: '/rastreador', icon: Activity },
    ],
  },
  {
    title: 'Coleções',
    items: [
      { label: 'Séries', to: '/series', icon: Layers },
      { label: 'Trilogias', to: '/trilogias', icon: BookMarked },
      { label: 'Não Terminados', to: '/nao-terminados', icon: XCircle },
    ],
  },
  {
    title: 'Favoritos',
    items: [
      { label: 'Livros', to: '/favoritos/livros', icon: Heart },
      { label: 'Autores', to: '/favoritos/autores', icon: Users },
      { label: 'Citações', to: '/favoritos/citacoes', icon: Quote },
    ],
  },
  {
    title: 'Desafios',
    items: [
      { label: 'Desafios', to: '/desafios', icon: Trophy },
      { label: 'Metas', to: '/metas', icon: Target },
      { label: 'Bingo', to: '/bingo', icon: LayoutGrid },
    ],
  },
  {
    title: 'PRO',
    items: [
      { label: 'Vision Board', to: '/vision-board', icon: Image, pro: true },
      { label: 'Estatísticas', to: '/estatisticas', icon: BarChart2, pro: true },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Assinatura', to: '/assinatura', icon: CreditCard },
      { label: 'Configurações', to: '/configuracoes', icon: Settings },
    ],
  },
]

function NavItemRow({ item, proUser }: { item: NavItem; proUser: boolean }) {
  const locked = item.pro && !proUser

  if (locked) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9B99A] cursor-not-allowed select-none">
        <item.icon size={17} />
        <span className="text-sm flex-1">{item.label}</span>
        <Lock size={13} />
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-[#F5ECF0] text-[#8B3A52] font-semibold'
            : 'text-[#7A6358] hover:bg-[#E8DDD0] hover:text-[#2C1810]'
        }`
      }
    >
      <item.icon size={17} />
      <span className="flex-1">{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, isPro: proUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E8DDD0]">
        <div className="w-8 h-8 rounded-lg bg-[#8B3A52] flex items-center justify-center">
          <BookOpen size={17} className="text-white" />
        </div>
        <span className="font-display text-lg font-bold text-[#2C1810]">Planner Literário</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#C9B99A] px-3 mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemRow key={item.to} item={item} proUser={proUser} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="border-t border-[#E8DDD0] px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#E8DDD0] transition-colors group">
          <div className="w-8 h-8 rounded-full bg-[#8B3A52] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name ?? '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C1810] truncate">{user?.name}</p>
            <p className="text-xs text-[#7A6358] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#7A6358] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-[#FAF7F2] border-r border-[#E8DDD0] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#FAF7F2] border-b border-[#E8DDD0]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#8B3A52] flex items-center justify-center">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-display font-bold text-[#2C1810]">Planner Literário</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-[#E8DDD0] transition-colors text-[#7A6358]"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#FAF7F2] h-full shadow-2xl flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[#E8DDD0] transition-colors text-[#7A6358]"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
