const GENRES = [
  'Romance', 'Ficção Científica', 'Fantasia', 'Mistério', 'Terror',
  'Thriller', 'Clássico', 'Biografia', 'Autoajuda', 'História',
  'Poesia', 'Conto', 'Distopia', 'Literatura Brasileira', 'Outro',
]

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function GenreSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
    >
      <option value="">Selecione um gênero</option>
      {GENRES.map((g) => (
        <option key={g} value={g}>{g}</option>
      ))}
    </select>
  )
}
