import { type LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-5">
        <Icon size={36} className="text-[#C9B99A]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2C1810] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#7A6358] max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-[#8B3A52] text-white rounded-lg text-sm font-medium hover:bg-[#6E2D40] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
