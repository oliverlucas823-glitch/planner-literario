const CONFIG = {
  lendo:     { label: 'Lendo',      className: 'bg-blue-100 text-blue-700' },
  lido:      { label: 'Lido',       className: 'bg-green-100 text-green-700' },
  abandonado:{ label: 'Abandonado', className: 'bg-gray-100 text-gray-600' },
  quero_ler: { label: 'Quero Ler',  className: 'bg-[#F5ECF0] text-[#8B3A52]' },
} as const

type Status = keyof typeof CONFIG

interface Props { status: Status }

export default function StatusBadge({ status }: Props) {
  const { label, className } = CONFIG[status] ?? CONFIG.quero_ler
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
