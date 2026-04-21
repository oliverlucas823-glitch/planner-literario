const EMOJIS = ['😊', '😄', '😂', '😮', '😢', '😤', '🔥']

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function EmojiSelector({ selected, onChange }: Props) {
  const toggle = (emoji: string) => {
    onChange(
      selected.includes(emoji)
        ? selected.filter((e) => e !== emoji)
        : [...selected, emoji]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((emoji) => {
        const active = selected.includes(emoji)
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={`text-2xl px-3 py-2 rounded-lg border-2 transition-all ${
              active
                ? 'bg-[#F5ECF0] border-[#8B3A52]'
                : 'bg-[#E8DDD0] border-transparent hover:border-[#C9B99A]'
            }`}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}
