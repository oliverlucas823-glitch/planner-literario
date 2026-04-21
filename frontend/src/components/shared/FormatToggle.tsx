import { BookOpen, Tablet, Headphones } from 'lucide-react'

type Format = 'fisico' | 'ebook' | 'audiobook'

interface Props {
  value: Format | null
  onChange: (v: Format) => void
}

const OPTIONS: { value: Format; label: string; Icon: typeof BookOpen }[] = [
  { value: 'fisico',    label: 'Físico',    Icon: BookOpen },
  { value: 'ebook',     label: 'eBook',     Icon: Tablet },
  { value: 'audiobook', label: 'Audiobook', Icon: Headphones },
]

export default function FormatToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-[#C9B99A]">
      {OPTIONS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm transition-colors ${
            value === v
              ? 'bg-[#8B3A52] text-white'
              : 'bg-[#E8DDD0] text-[#7A6358] hover:bg-[#C9B99A]'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
