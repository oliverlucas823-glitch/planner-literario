import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Flame, Tag, BookMarked, BookPlus, Target } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { readingDaysApi } from '@/api/reading-days'
import { statsApi } from '@/api/stats'
import { booksApi } from '@/api/books'
import { challengesApi } from '@/api/challenges'
import { useAuthStore } from '@/store/authStore'
import type { Streak, Challenge, Book } from '@/types'
import HeatmapYear from '@/components/shared/HeatmapYear'
import ProGate from '@/components/shared/ProGate'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

const YEAR = new Date().getFullYear()
const LS_KEY = `meta_anual_${YEAR}`

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const MOCK_MONTHS = MONTH_ABBR.map((name, i) => ({
  name,
  livros: [2, 4, 1, 5, 3, 7, 2, 4, 6, 3, 8, 5][i],
}))

interface Overview {
  books_read?: number
  books_reading?: number
  avg_rating?: number
  favorite_genre?: string
}

type MonthEntry = { month: number; count: number; name?: string }

function MetricCard({
  icon: Icon,
  value,
  label,
  sub,
  loading,
}: {
  icon: typeof BookOpen
  value: string | number
  label: string
  sub?: string
  loading: boolean
}) {
  return (
    <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl bg-[#F5ECF0] flex items-center justify-center mb-4">
            <Icon size={20} className="text-[#8B3A52]" />
          </div>
          <p className="font-display text-3xl font-bold text-[#2C1810]">{value}</p>
          <p className="text-sm text-[#7A6358] mt-1">{label}</p>
          {sub && <p className="text-xs text-[#C9B99A] mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#FAF7F2] border border-[#E8DDD0] rounded-lg px-3 py-2 text-sm shadow">
      <p className="font-medium text-[#2C1810]">{label}</p>
      <p className="text-[#8B3A52]">{payload[0].value} livros</p>
    </div>
  )
}

export default function Dashboard() {
  const { isPro } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [readingBooks, setReadingBooks] = useState<Book[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [monthData, setMonthData] = useState<MonthEntry[]>([])
  const [readingDates, setReadingDates] = useState<string[]>([])
  const [booksReadCount, setBooksReadCount] = useState(0)

  // Meta anual (localStorage)
  const [goal, setGoal] = useState<number | null>(null)
  const [goalInput, setGoalInput] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      const n = Number(stored)
      if (!isNaN(n) && n > 0) { setGoal(n); setGoalInput(String(n)) }
    }
  }, [])

  const saveGoal = () => {
    const n = Number(goalInput)
    if (!n || n <= 0) return
    localStorage.setItem(LS_KEY, String(n))
    setGoal(n)
    setEditingGoal(false)
  }

  useEffect(() => {
    const year = new Date().getFullYear()

    const fetchAll = async () => {
      const results = await Promise.allSettled([
        readingDaysApi.getStreak(),
        booksApi.list({ status: 'lendo', limit: 3 }),
        booksApi.list({ sort_by: 'updated_at', sort_order: 'desc', limit: 6 }),
        challengesApi.list(),
        readingDaysApi.list({ year }),
        booksApi.list({ status: 'lido', limit: 1 }),
      ])

      const [streakR, readingR, recentR, challengesR, rdaysR, readCountR] = results

      if (streakR.status === 'fulfilled') {
        const d = streakR.value.data as Streak & Record<string, unknown>
        setStreak({ current_streak: Number(d.current_streak), max_streak: Number(d.max_streak), total_days_read: Number(d.total_days_read) })
      }
      if (readingR.status === 'fulfilled') {
        setReadingBooks((readingR.value.data as { books: Book[] }).books ?? [])
      }
      if (recentR.status === 'fulfilled') {
        setRecentBooks((recentR.value.data as { books: Book[] }).books ?? [])
      }
      if (challengesR.status === 'fulfilled') {
        setChallenges((challengesR.value.data as { challenges: Challenge[] }).challenges ?? [])
      }
      if (rdaysR.status === 'fulfilled') {
        const days = (rdaysR.value.data as { reading_days?: { read_date: string }[] }).reading_days ?? []
        setReadingDates(days.map((d) => d.read_date.slice(0, 10)))
      }
      if (readCountR.status === 'fulfilled') {
        const pag = (readCountR.value.data as { pagination?: { total: number } }).pagination
        setBooksReadCount(pag?.total ?? 0)
      }

      // PRO stats (silently ignore errors)
      try {
        const [overviewRes, monthRes] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getByMonth(year),
        ])
        setOverview(overviewRes.data as Overview)
        const raw = (monthRes.data as { by_month?: MonthEntry[] }).by_month ?? (monthRes.data as MonthEntry[])
        setMonthData(Array.isArray(raw) ? raw : [])
      } catch {
        // FREE user or no stats yet
      }

      setLoading(false)
    }

    fetchAll()
  }, [])

  const chartData =
    monthData.length > 0
      ? monthData.map((m) => ({ name: MONTH_ABBR[(m.month ?? 1) - 1] ?? `M${m.month}`, livros: m.count }))
      : MOCK_MONTHS

  const activeChallengesToShow = isPro ? challenges.filter((c) => c.is_active) : challenges.filter((c) => c.is_active).slice(0, 1)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#2C1810]">Dashboard</h1>
          <p className="text-sm text-[#7A6358] mt-0.5">Bem-vindo de volta à sua leitura.</p>
        </div>
        <Link
          to="/adicionar"
          className="flex items-center gap-2 px-4 py-2 bg-[#8B3A52] text-white rounded-lg text-sm font-medium hover:bg-[#6E2D40] transition-colors"
        >
          <BookPlus size={16} />
          Adicionar livro
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={BookOpen}
          value={overview?.books_read ?? booksReadCount}
          label={`livros lidos em ${new Date().getFullYear()}`}
          loading={loading}
        />
        <MetricCard
          icon={Flame}
          value={streak?.current_streak ?? 0}
          label="dias seguidos"
          sub={streak ? `Máximo: ${streak.max_streak} dias` : undefined}
          loading={loading}
        />
        <MetricCard
          icon={Tag}
          value={overview?.favorite_genre ?? '—'}
          label="gênero favorito"
          loading={loading}
        />
        <MetricCard
          icon={BookMarked}
          value={overview?.books_reading ?? readingBooks.length}
          label="em andamento"
          loading={loading}
        />
      </div>

      {/* Meta anual card */}
      <div className="bg-white border border-[#E8DDD0] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F5ECF0] flex items-center justify-center flex-shrink-0">
              <Target size={18} className="text-[#8B3A52]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2C1810]">Meta {YEAR}</p>
              {loading ? (
                <p className="text-xs text-[#C9B99A]">carregando…</p>
              ) : goal ? (
                <p className="text-xs text-[#7A6358]">
                  Você leu <span className="font-bold text-[#8B3A52]">{booksReadCount}</span> de{' '}
                  <span className="font-bold text-[#2C1810]">{goal}</span> livros em {YEAR}
                </p>
              ) : (
                <p className="text-xs text-[#C9B99A]">Meta não definida</p>
              )}
            </div>
          </div>

          {/* Progress bar or input */}
          {goal && !editingGoal ? (
            <div className="flex items-center gap-3 flex-1 min-w-48">
              <div className="flex-1 bg-[#E8DDD0] rounded-full h-2.5">
                <div
                  className="bg-[#8B3A52] h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((booksReadCount / goal) * 100))}%` }}
                />
              </div>
              <span className="text-xs text-[#7A6358] flex-shrink-0 w-10 text-right">
                {Math.min(100, Math.round((booksReadCount / goal) * 100))}%
              </span>
              <button
                onClick={() => setEditingGoal(true)}
                className="text-xs text-[#8B3A52] hover:underline flex-shrink-0"
              >
                Editar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                placeholder="Ex: 24"
                autoFocus={editingGoal}
                className="w-24 px-2.5 py-1.5 rounded-lg border border-[#C9B99A] text-sm text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
              />
              <button
                onClick={saveGoal}
                className="px-3 py-1.5 rounded-lg bg-[#8B3A52] text-white text-xs font-medium hover:bg-[#7A2D42] transition-colors"
              >
                {goal ? 'Salvar' : 'Definir meta'}
              </button>
              {editingGoal && (
                <button
                  onClick={() => setEditingGoal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#C9B99A] text-[#7A6358] text-xs hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#2C1810] mb-4">Leituras por mês</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ProGate isPro={isPro} message="Gráficos disponíveis no plano PRO">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7A6358' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7A6358' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="livros" fill="#8B3A52" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ProGate>
          )}
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-2 bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#2C1810] mb-4">Dias de leitura</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-2xl font-bold font-display text-[#8B3A52]">
                    {streak?.current_streak ?? 0}
                  </span>
                  <span className="text-[#7A6358] ml-1">dias seguidos</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-[#2C1810]">
                    {streak?.total_days_read ?? readingDates.length}
                  </span>
                  <span className="text-[#7A6358] ml-1">total</span>
                </div>
              </div>
              <HeatmapYear readDates={readingDates} />
            </div>
          )}
        </div>
      </div>

      {/* Recent books + Active challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reading / Recent books */}
        <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2C1810]">
              {readingBooks.length > 0 ? 'Lendo agora' : 'Últimas adições'}
            </h2>
            <Link to="/biblioteca" className="text-xs text-[#8B3A52] hover:underline">
              Ver biblioteca →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <>
              {(readingBooks.length > 0 ? readingBooks : recentBooks).length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Nenhum livro ainda"
                  description="Adicione seu primeiro livro."
                  action={{ label: 'Adicionar livro', onClick: () => window.location.href = '/adicionar' }}
                />
              ) : (
                <div className="space-y-3">
                  {(readingBooks.length > 0 ? readingBooks : recentBooks).map((book) => (
                    <Link
                      key={book.id}
                      to={`/biblioteca/${book.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors group"
                    >
                      <div className="w-10 h-14 rounded-lg bg-[#E8DDD0] flex-shrink-0 overflow-hidden">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={16} className="text-[#C9B99A]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C1810] truncate group-hover:text-[#8B3A52] transition-colors">
                          {book.title}
                        </p>
                        <p className="text-xs text-[#7A6358] truncate">{book.author}</p>
                        {book.progress > 0 && (
                          <div className="mt-1.5 h-1 bg-[#E8DDD0] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#8B3A52] rounded-full"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Active challenges */}
        <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2C1810]">Desafios ativos</h2>
            <Link to="/desafios" className="text-xs text-[#8B3A52] hover:underline">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : activeChallengesToShow.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="Sem desafios ativos"
              description="Crie um desafio de leitura."
              action={{ label: 'Criar desafio', onClick: () => window.location.href = '/desafios' }}
            />
          ) : (
            <div className="space-y-4">
              {activeChallengesToShow.map((challenge) => {
                const completed = challenge.items?.filter((i) => i.completed).length ?? challenge.completed_count ?? 0
                const total = challenge.goal ?? challenge.items?.length ?? 1
                const pct = Math.round((completed / total) * 100)
                return (
                  <div key={challenge.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-[#2C1810] truncate pr-2">{challenge.name}</p>
                      <span className="text-xs text-[#7A6358] flex-shrink-0">{completed}/{total}</span>
                    </div>
                    <div className="h-2 bg-[#E8DDD0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8B3A52] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#C9B99A] mt-0.5 text-right">{pct}%</p>
                  </div>
                )
              })}
              {!isPro && challenges.filter((c) => c.is_active).length > 1 && (
                <div className="flex items-center gap-2 p-3 bg-[#F5ECF0] rounded-xl text-sm text-[#8B3A52]">
                  <span>+{challenges.filter((c) => c.is_active).length - 1} mais no plano PRO</span>
                  <Link to="/assinatura" className="font-semibold underline ml-auto">
                    Assinar
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
