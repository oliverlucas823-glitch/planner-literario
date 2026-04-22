import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Trophy, Plus, Grid3X3 } from 'lucide-react'
import { challengesApi } from '@/api/challenges'
import type { Challenge } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

const TYPE_LABELS: Record<string, string> = {
  '10': '10 livros',
  '25': '25 livros',
  '50': '50 livros',
  '100': '100 livros',
  'cores': 'Cores',
  'bingo': 'Bingo',
  'custom': 'Personalizado',
}

const DEFAULT_NAMES: Record<string, string> = {
  '10': 'Desafio 10 Livros',
  '25': 'Desafio 25 Livros',
  '50': 'Desafio 50 Livros',
  '100': 'Desafio 100 Livros',
  'cores': 'Desafio das Cores',
  'bingo': 'Bingo Literário',
  'custom': 'Meu Desafio Personalizado',
}

export default function Desafios() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [type, setType] = useState('10')
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    challengesApi.list()
      .then(({ data }) => {
        const list = (data as { challenges?: Challenge[] }).challenges ?? []
        setChallenges(list)
      })
      .catch(() => toast.error('Erro ao carregar desafios'))
      .finally(() => setLoading(false))
  }, [])

  const openModal = () => {
    const currentYear = new Date().getFullYear()
    setType('10')
    setName(`${DEFAULT_NAMES['10']} ${currentYear}`)
    setGoal('')
    setYear(currentYear)
    setShowModal(true)
  }

  const handleTypeChange = (newType: string) => {
    setType(newType)
    setName(`${DEFAULT_NAMES[newType] ?? 'Desafio'} ${year}`)
  }

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Informe o nome do desafio')
    if ((type === 'custom' || type === 'cores') && !goal) return toast.error('Informe a meta')

    setCreating(true)
    try {
      const payload: Record<string, unknown> = { type, name: name.trim(), year }
      if (type === 'custom' || type === 'cores') payload.goal = Number(goal)

      const { data } = await challengesApi.create(payload)
      const created = (data as { challenge?: Challenge }).challenge
      if (created) setChallenges((prev) => [created, ...prev])
      setShowModal(false)
      toast.success('Desafio criado!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erro ao criar desafio')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-[#2C1810]">Meus Desafios</h1>
            <p className="text-sm text-[#7A6358] mt-0.5">Acompanhe seus desafios de leitura.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/desafios/bingo"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9B99A] text-[#7A6358] text-sm hover:bg-[#E8DDD0] transition-colors"
            >
              <Grid3X3 size={16} /> Bingo Literário
            </Link>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B3A52] text-white text-sm font-medium hover:bg-[#7A2D42] transition-colors"
            >
              <Plus size={16} /> Criar desafio
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhum desafio criado ainda"
            description="Crie seu primeiro desafio de leitura para começar."
            action={{ label: 'Criar primeiro desafio', onClick: openModal }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c) => {
              const total = c.items.length
              const completed = c.completed_count ?? c.items.filter((i) => i.completed).length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/desafios/${c.id}`)}
                  className="bg-white border border-[#E8DDD0] rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:border-[#8B3A52]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F5ECF0] flex items-center justify-center">
                      <Trophy size={18} className="text-[#8B3A52]" />
                    </div>
                    <span className="text-xs text-[#C9B99A] font-medium">{c.year}</span>
                  </div>
                  <p className="font-semibold text-[#2C1810] text-sm mb-0.5 line-clamp-2">{c.name}</p>
                  <p className="text-xs text-[#7A6358] mb-3">{TYPE_LABELS[c.type] ?? c.type}</p>
                  <div className="w-full bg-[#E8DDD0] rounded-full h-1.5 mb-1.5">
                    <div
                      className="bg-[#8B3A52] h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#7A6358]">{completed}/{total} · {pct}%</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold font-display text-[#2C1810]">Novo desafio</h2>

            <div>
              <label className="block text-xs text-[#7A6358] mb-1">Tipo de desafio</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#7A6358] mb-1">Nome do desafio</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
                placeholder="Nome do desafio"
              />
            </div>

            {(type === 'custom' || type === 'cores') && (
              <div>
                <label className="block text-xs text-[#7A6358] mb-1">Meta (quantidade)</label>
                <input
                  type="number"
                  min={1}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
                  placeholder="Ex: 15"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-[#7A6358] mb-1">Ano</label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#C9B99A] text-[#7A6358] text-sm hover:bg-[#FAF7F2] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#8B3A52] text-white text-sm font-medium hover:bg-[#7A2D42] transition-colors disabled:opacity-60"
              >
                {creating ? 'Criando...' : 'Criar desafio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
