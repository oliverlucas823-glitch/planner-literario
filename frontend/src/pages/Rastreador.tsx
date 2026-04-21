import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Flame, Calendar, BookOpen, TrendingUp } from 'lucide-react'
import { readingDaysApi } from '@/api/reading-days'
import type { Streak } from '@/types'
import HeatmapYear from '@/components/shared/HeatmapYear'
import ReadingCalendar from '@/components/shared/ReadingCalendar'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

interface ReadingDay {
  id: string
  read_date: string
  book?: { title: string; author: string; cover_url: string | null }
}

export default function Rastreador() {
  const year = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [readingDays, setReadingDays] = useState<ReadingDay[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [daysRes, streakRes] = await Promise.all([
          readingDaysApi.list({ year }),
          readingDaysApi.getStreak(),
        ])

        const days: ReadingDay[] = (daysRes.data as { reading_days?: ReadingDay[] }).reading_days ?? []
        const streakData = streakRes.data as Streak

        // debug: confirm shape received from API
        console.log('[Rastreador] reading_days count:', days.length, 'sample:', days[0])
        console.log('[Rastreador] streak:', streakData)

        setReadingDays(days)
        setStreak(streakData)
      } catch (err) {
        console.error('[Rastreador] fetch error:', err)
        toast.error('Erro ao carregar dados de leitura')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [year])

  // HeatmapYear expects plain "YYYY-MM-DD" strings
  const heatmapDates = useMemo(
    () => readingDays.map((d) => d.read_date.slice(0, 10)),
    [readingDays],
  )

  // Dates for the calendar of the current month in view
  const calendarDates = useMemo(
    () =>
      heatmapDates.filter((d) => {
        const [y, m] = d.split('-').map(Number)
        return y === year && m === calMonth + 1
      }),
    [heatmapDates, year, calMonth],
  )

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-[#2C1810]">Rastreador de Leitura</h1>
          <p className="text-sm text-[#7A6358] mt-0.5">Acompanhe sua frequência de leitura ao longo do ano.</p>
        </div>

        {/* Streak cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))
          ) : (
            <>
              {[
                { icon: Flame, label: 'Sequência atual', value: `${streak?.current_streak ?? 0} dias`, color: 'text-orange-500' },
                { icon: TrendingUp, label: 'Maior sequência', value: `${streak?.max_streak ?? 0} dias`, color: 'text-[#8B3A52]' },
                { icon: Calendar, label: 'Total de dias lidos', value: `${streak?.total_days_read ?? readingDays.length}`, color: 'text-blue-500' },
                { icon: BookOpen, label: `Dias em ${year}`, value: `${heatmapDates.length}`, color: 'text-green-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white border border-[#E8DDD0] rounded-2xl p-5 shadow-sm">
                  <Icon size={20} className={`${color} mb-3`} />
                  <p className="font-display text-2xl font-bold text-[#2C1810]">{value}</p>
                  <p className="text-xs text-[#7A6358] mt-0.5">{label}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Year heatmap */}
        <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#2C1810] mb-4">Mapa de leitura — {year}</h2>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : heatmapDates.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhum dia de leitura registrado"
              description="Marque os dias que você leu nos detalhes de cada livro."
            />
          ) : (
            <HeatmapYear readDates={heatmapDates} year={year} />
          )}
        </div>

        {/* Monthly calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-[#2C1810] mb-4">Calendário — {MONTH_NAMES[calMonth]}</h2>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ReadingCalendar
                year={year}
                month={calMonth}
                readDates={calendarDates}
                onPrev={() => setCalMonth((m) => (m === 0 ? 11 : m - 1))}
                onNext={() => setCalMonth((m) => (m === 11 ? 0 : m + 1))}
              />
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-[#2C1810] mb-4">Atividade recente</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : readingDays.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Sem atividade ainda"
                description="Seus dias de leitura aparecerão aqui."
              />
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {[...readingDays]
                  .sort((a, b) => b.read_date.localeCompare(a.read_date))
                  .slice(0, 20)
                  .map((day) => {
                    const date = new Date(day.read_date + 'T12:00:00')
                    return (
                      <div key={day.id} className="flex items-center gap-3 py-2 border-b border-[#E8DDD0] last:border-0">
                        <div className="w-2 h-2 rounded-full bg-[#8B3A52] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#2C1810] truncate">
                            {day.book?.title ?? 'Livro'}
                          </p>
                          {day.book?.author && (
                            <p className="text-xs text-[#7A6358] truncate">{day.book.author}</p>
                          )}
                        </div>
                        <span className="text-xs text-[#C9B99A] flex-shrink-0">
                          {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
