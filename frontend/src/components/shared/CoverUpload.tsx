import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'

interface Props {
  value?: string | null
  onChange: (file: File) => void
  onRemove?: () => void
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export default function CoverUpload({ value, onChange, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Tamanho máximo: 2MB.')
      return
    }
    onChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-32 aspect-[2/3] rounded-xl overflow-hidden border-2 border-[#C9B99A]">
          <img src={value} alt="Capa" className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
            >
              <X size={12} className="text-red-600" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging ? 'border-[#8B3A52] bg-[#F5ECF0]' : 'border-[#C9B99A] bg-[#E8DDD0] hover:border-[#8B3A52] hover:bg-[#F5ECF0]'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
            <ImageIcon size={22} className="text-[#C9B99A]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#2C1810]">Arraste ou clique para enviar</p>
            <p className="text-xs text-[#7A6358] mt-1">PNG, JPG até 2MB</p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#8B3A52] text-white rounded-lg text-xs font-medium">
            <Upload size={13} />
            Escolher arquivo
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
