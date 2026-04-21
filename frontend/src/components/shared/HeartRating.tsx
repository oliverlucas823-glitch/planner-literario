import { useState } from 'react'
import { Heart } from 'lucide-react'

interface Props {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
}

export default function HeartRating({ value, onChange, readonly = false }: Props) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = (hover || value) > i
        return (
          <Heart
            key={i}
            size={18}
            className={`transition-colors ${
              filled ? 'text-[#8B3A52] fill-[#8B3A52]' : 'text-[#C9B99A]'
            } ${!readonly ? 'cursor-pointer' : ''}`}
            onClick={() => !readonly && onChange?.(i + 1)}
            onMouseEnter={() => !readonly && setHover(i + 1)}
            onMouseLeave={() => !readonly && setHover(0)}
          />
        )
      })}
    </div>
  )
}
