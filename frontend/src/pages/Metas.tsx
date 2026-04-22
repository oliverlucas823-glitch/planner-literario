import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Target, BookOpen } from 'lucide-react'
import { booksApi } from '@/api/books'
import { Skeleton } from '@/components/shared/Skeleton'

const YEAR = new Date().getFullYear()
const LS_KEY = `meta_anual_${YEAR}`

export default function Metas() {
  const [goalInput, setGoalInput] = useState('')
  const [savedGoal, setSavedGoal] = useState<number | null>(null)
  const [booksRead, setBooksRead] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Load saved goal from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      const n = Number(stored)
      if (!isNaN(n) && n > 0) {
        setSavedGoal(n)
        setGoalInput(String(n))
      }
    }
  }, [])

  // Fetch total books read
  useEffect(() => {
    booksApi.list({ status: 'lido', limit: 1 })
      .then(({ data }) => {
        const total = (data as { pagination?: { total: number } }).pagination?.total ?? 0
        setBooksRead(total)
      })
      .catch(() => toast.error('Erro ao carregar livros lidos'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = () => {
    const n = Number(goalInput)
    if (!goalInput || isNaN(n) || n <= 0) {
      toast.error('Informe uma meta válida')
      return
    }
    localStorage.setItem(LS_KEY, String(n))
    setSavedGoal(n)
    toast.success('Meta salva!')
  }

  const pct = savedGoal && booksRead !== null
    ? Math.min(100, Math.round((booksRead / savedGoal) * 100))
    : 0

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-[#2C1810]">Metas de Leitura</h1>
          <p className="text-sm text-[#7A6358] mt-0.5">Defina e acompanhe sua meta anual de leitura.</p>
        </div>

        {/* Meta anual */}
        <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5ECF0] flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-[#8B3A52]" />
            </div>
            <div>
              <p className="font-semibold text-[#2C1810]">Meta anual {YEAR}</p>
              <p className="text-xs text-[#7A6358]">Quantos livros você quer ler em {YEAR}?</p>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-[#7A6358] mb-1">Número de livros</label>
              <input
                type="number"
                min={1}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                placeholder="Ex: 24"
              />
            </div>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#8B3A52] text-white text-sm font-medium hover:bg-[#7A2D42] transition-colors"
            >
              Salvar meta
            </button>
          </div>

          {/* Progress */}
          {savedGoal && (
            <div className="space-y-3 pt-2 border-t border-[#E8DDD0]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4EB] flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-green-600" />
                </div>
                {loading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <p className="text-sm text-[#2C1810]">
                    Você leu{' '}
                    <span className="font-bold text-[#8B3A52]">{booksRead ?? 0}</span>
                    {' '}de{' '}
                    <span className="font-bold text-[#2C1810]">{savedGoal}</span>
                    {' '}livros em {YEAR}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#7A6358] mb-1.5">
                  <span>{pct}% concluído</span>
                  <span>{Math.max(0, savedGoal - (booksRead ?? 0))} restantes</span>
                </div>
                <div className="w-full bg-[#E8DDD0] rounded-full h-3">
                  <div
                    className="bg-[#8B3A52] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {pct >= 100 && (
                <div className="bg-[#F5ECF0] border border-[#8B3A52]/30 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-[#8B3A52]">🎉 Parabéns! Você atingiu sua meta!</p>
                  <p className="text-xs text-[#7A6358] mt-1">
                    Que tal aumentar o desafio para {savedGoal + 5} livros?
                  </p>
                </div>
              )}
            </div>
          )}

          {!savedGoal && !loading && (
            <p className="text-sm text-[#C9B99A] text-center py-2">
              Defina sua meta acima para acompanhar o progresso.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
