import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  year: number
  month: number // 0-indexed
  readDates: string[]
  onToggle?: (date: string) => void
  onPrev?: () => void
  onNext?: () => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function ReadingCalendar({ year, month, readDates, onToggle, onPrev, onNext }: Props) {
  const readSet = useMemo(() => new Set(readDates.map((d) => d.slice(0, 10))), [readDates])

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const today = new Date()

  return (
    <div className="bg-white rounded-xl border border-[#E8DDD0] p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-[#E8DDD0] transition-colors text-[#7A6358]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-[#2C1810] text-sm">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-[#E8DDD0] transition-colors text-[#7A6358]"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-[#7A6358] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const read = readSet.has(iso)
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
          const isFuture = new Date(iso) > today

          return (
            <button
              key={iso}
              type="button"
              disabled={isFuture || !onToggle}
              onClick={() => onToggle?.(iso)}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                read
                  ? 'bg-[#8B3A52] text-white'
                  : isToday
                  ? 'bg-[#F5ECF0] text-[#8B3A52] border border-[#8B3A52]'
                  : isFuture
                  ? 'text-[#C9B99A] cursor-default'
                  : 'text-[#2C1810] hover:bg-[#E8DDD0]'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
