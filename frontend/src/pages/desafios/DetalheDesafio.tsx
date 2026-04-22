import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Trophy, BookOpen, CheckCircle2, Circle } from 'lucide-react'
import { challengesApi } from '@/api/challenges'
import type { Challenge, ChallengeItem } from '@/types'
import { Skeleton } from '@/components/shared/Skeleton'

const TYPE_LABELS: Record<string, string> = {
  '10': '10 livros',
  '25': '25 livros',
  '50': '50 livros',
  '100': '100 livros',
  'cores': 'Cores',
  'bingo': 'Bingo',
  'custom': 'Personalizado',
}

export default function DetalheDesafio() {
  const { id } = useParams<{ id: string }>()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    challengesApi.get(id)
      .then(({ data }) => {
        const c = (data as { challenge?: Challenge }).challenge ?? null
        setChallenge(c)
      })
      .catch(() => toast.error('Erro ao carregar desafio'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleItem = async (item: ChallengeItem) => {
    if (!challenge || !id) return
    const newCompleted = !item.completed

    // Optimistic update
    setChallenge((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.id === item.id ? { ...i, completed: newCompleted } : i,
            ),
            completed_count: (prev.completed_count ?? 0) + (newCompleted ? 1 : -1),
          }
        : null,
    )

    try {
      await challengesApi.assignBook(id, item.id, {
        book_id: item.book_id,
        completed: newCompleted,
      })
    } catch {
      // Revert on error
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === item.id ? { ...i, completed: item.completed } : i,
              ),
              completed_count: (prev.completed_count ?? 0) + (newCompleted ? -1 : 1),
            }
          : null,
      )
      toast.error('Erro ao atualizar item')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full mt-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="p-8 text-center text-[#7A6358]">
        <p>Desafio não encontrado.</p>
        <Link to="/desafios" className="text-[#8B3A52] hover:underline mt-2 inline-block">
          Voltar aos desafios
        </Link>
      </div>
    )
  }

  const total = challenge.items.length
  const completed = challenge.items.filter((i) => i.completed).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#7A6358]">
          <Link to="/desafios" className="hover:text-[#8B3A52] transition-colors">
            Desafios
          </Link>
          <span>/</span>
          <span className="text-[#2C1810] truncate max-w-xs">{challenge.name}</span>
        </nav>

        {/* Header card */}
        <div className="bg-white border border-[#E8DDD0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F5ECF0] flex items-center justify-center flex-shrink-0">
              <Trophy size={22} className="text-[#8B3A52]" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold font-display text-[#2C1810]">{challenge.name}</h1>
              <p className="text-sm text-[#7A6358] mt-0.5">
                {TYPE_LABELS[challenge.type] ?? challenge.type} · {challenge.year}
              </p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-[#7A6358]">
                  <span>{completed} de {total} concluídos</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-[#E8DDD0] rounded-full h-2">
                  <div
                    className="bg-[#8B3A52] h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items grid */}
        <div>
          <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">
            Itens — clique para marcar como concluído
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {challenge.items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  item.completed
                    ? 'bg-[#F5ECF0] border-[#8B3A52]/40'
                    : 'bg-white border-[#E8DDD0] hover:border-[#8B3A52]/30 hover:shadow-sm'
                }`}
              >
                <div className="mb-2">
                  {item.completed
                    ? <CheckCircle2 size={16} className="text-[#8B3A52]" />
                    : <Circle size={16} className="text-[#C9B99A]" />
                  }
                </div>
                {item.book ? (
                  <div>
                    <p className="text-xs font-medium text-[#2C1810] line-clamp-2 leading-snug">
                      {item.book.title}
                    </p>
                    <p className="text-xs text-[#7A6358] mt-0.5 truncate">{item.book.author}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#7A6358] line-clamp-2 leading-snug">
                      {item.slot_label}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[#C9B99A]">
                      <BookOpen size={11} />
                      <span className="text-xs">Vazio</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
