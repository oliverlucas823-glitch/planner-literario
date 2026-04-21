interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}

const SEGMENTS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

export default function ProgressBar({ value, onChange, readonly = false }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {SEGMENTS.map((seg) => (
          <button
            key={seg}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(seg)}
            className={`h-3 flex-1 rounded-sm transition-colors ${
              value >= seg ? 'bg-[#8B3A52]' : 'bg-[#E8DDD0]'
            } ${!readonly ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          />
        ))}
      </div>
      <span className="text-xs text-[#7A6358] w-8 text-right">{value}%</span>
    </div>
  )
}
