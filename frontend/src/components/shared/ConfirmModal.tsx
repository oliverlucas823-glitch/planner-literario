import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#7A6358] hover:text-[#2C1810] transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold text-[#2C1810] mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-[#7A6358] mb-6">{description}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#C9B99A] text-[#7A6358] text-sm hover:bg-[#E8DDD0] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#8B3A52] hover:bg-[#6E2D40]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
