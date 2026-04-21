import { useMemo } from 'react'

interface Props {
  readDates: string[] // ISO date strings
  year?: number
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function HeatmapYear({ readDates, year = new Date().getFullYear() }: Props) {
  const readSet = useMemo(() => new Set(readDates.map((d) => d.slice(0, 10))), [readDates])

  const weeks = useMemo(() => {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    // Align to Sunday
    const cursor = new Date(start)
    cursor.setDate(cursor.getDate() - cursor.getDay())

    const result: { date: Date | null }[][] = []
    while (cursor <= end || result.length === 0) {
      const week: { date: Date | null }[] = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cursor)
        week.push({ date: day.getFullYear() === year ? day : null })
        cursor.setDate(cursor.getDate() + 1)
      }
      result.push(week)
      if (cursor.getFullYear() > year) break
    }
    return result
  }, [year])

  const cellSize = 12
  const gap = 2
  const labelWidth = 28
  const topOffset = 20

  const totalWidth = labelWidth + weeks.length * (cellSize + gap)
  const totalHeight = topOffset + 7 * (cellSize + gap)

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalWidth}
        height={totalHeight}
        className="text-[#2C1810]"
      >
        {/* Month labels */}
        {weeks.map((week, wi) => {
          const firstValid = week.find((d) => d.date !== null)?.date
          if (!firstValid) return null
          if (firstValid.getDate() <= 7) {
            const x = labelWidth + wi * (cellSize + gap)
            return (
              <text key={wi} x={x} y={12} fontSize={9} fill="#7A6358">
                {MONTHS[firstValid.getMonth()]}
              </text>
            )
          }
          return null
        })}

        {/* Day labels */}
        {[1, 3, 5].map((dayIdx) => (
          <text
            key={dayIdx}
            x={0}
            y={topOffset + dayIdx * (cellSize + gap) + cellSize - 2}
            fontSize={8}
            fill="#7A6358"
          >
            {DAYS_OF_WEEK[dayIdx]}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.map((cell, di) => {
            const x = labelWidth + wi * (cellSize + gap)
            const y = topOffset + di * (cellSize + gap)
            if (!cell.date) return null
            const iso = cell.date.toISOString().slice(0, 10)
            const read = readSet.has(iso)
            return (
              <rect
                key={`${wi}-${di}`}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={read ? '#8B3A52' : '#E8DDD0'}
                opacity={read ? 1 : 0.7}
              >
                <title>{iso}</title>
              </rect>
            )
          })
        )}
      </svg>
    </div>
  )
}
