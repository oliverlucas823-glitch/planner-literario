import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 14, md: 18, lg: 24 }

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const [hover, setHover] = useState(0)
  const px = sizes[size]

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = (hover || value) > i
        return (
          <Star
            key={i}
            size={px}
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
