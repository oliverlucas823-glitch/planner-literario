import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Grid3X3, Plus, RotateCcw, Search, X } from 'lucide-react'
import { challengesApi } from '@/api/challenges'
import { booksApi } from '@/api/books'
import type { Book, Challenge, ChallengeItem } from '@/types'
import { Skeleton } from '@/components/shared/Skeleton'
import ConfirmModal from '@/components/shared/ConfirmModal'

// ── Bingo line definitions (positions 0-24 in a 5x5 grid) ────────────────────
const LINES: number[][] = [
  // Rows
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
]

function getWinningPositions(items: ChallengeItem[]): Set<number> {
  const completed = new Set(items.filter((i) => i.completed).map((i) => i.position))
  const winning = new Set<number>()
  for (const line of LINES) {
    if (line.every((p) => completed.has(p))) {
      line.forEach((p) => winning.add(p))
    }
  }
  return winning
}

export default function Bingo() {
  const year = new Date().getFullYear()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Book picker modal
  const [pickerItem, setPickerItem] = useState<ChallengeItem | null>(null)
  const [bookSearch, setBookSearch] = useState('')
  const [bookResults, setBookResults] = useState<Book[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // ── Load bingo challenge ────────────────────────────────────────────────────
  useEffect(() => {
    challengesApi.list()
      .then(({ data }) => {
        const list = (data as { challenges?: Challenge[] }).challenges ?? []
        const bingo = list.find((c) => c.type === 'bingo') ?? null
        setChallenge(bingo)
      })
      .catch(() => toast.error('Erro ao carregar bingo'))
      .finally(() => setLoading(false))
  }, [])

  // ── Create bingo ────────────────────────────────────────────────────────────
  const createBingo = async () => {
    setCreating(true)
    try {
      const { data } = await challengesApi.create({
        type: 'bingo',
        name: `Bingo Literário ${year}`,
        year,
      })
      const created = (data as { challenge?: Challenge }).challenge
      if (created) setChallenge(created)
      toast.success('Bingo criado!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erro ao criar bingo')
    } finally {
      setCreating(false)
    }
  }

  // ── Reset bingo ─────────────────────────────────────────────────────────────
  const resetBingo = async () => {
    if (!challenge) return
    setResetting(true)
    try {
      await challengesApi.delete(challenge.id)
      const { data } = await challengesApi.create({
        type: 'bingo',
        name: `Bingo Literário ${year}`,
        year,
      })
      const created = (data as { challenge?: Challenge }).challenge
      setChallenge(created ?? null)
      toast.success('Bingo reiniciado!')
    } catch {
      toast.error('Erro ao reiniciar bingo')
    } finally {
      setResetting(false)
      setShowResetModal(false)
    }
  }

  // ── Book search ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pickerItem) return
    setBookSearch('')
    setBookResults([])
  }, [pickerItem])

  useEffect(() => {
    if (!pickerItem) return
    setSearchLoading(true)
    const timer = setTimeout(() => {
      booksApi.list({ search: bookSearch || undefined, limit: 20 })
        .then(({ data }) => {
          const books = (data as { books?: Book[] }).books ?? []
          setBookResults(books)
        })
        .catch(() => {})
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [bookSearch, pickerItem])

  // ── Assign book to cell ─────────────────────────────────────────────────────
  const assignBook = async (book: Book) => {
    if (!challenge || !pickerItem) return
    setAssigning(true)
    try {
      await challengesApi.assignBook(challenge.id, pickerItem.id, {
        book_id: book.id,
        completed: true,
      })
      // Update local state optimistically
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === pickerItem.id
                  ? { ...i, book_id: book.id, completed: true, book: { id: book.id, title: book.title, author: book.author, cover_url: book.cover_url } }
                  : i,
              ),
            }
          : null,
      )
      setPickerItem(null)
      toast.success(`"${book.title}" atribuído!`)
    } catch {
      toast.error('Erro ao atribuir livro')
    } finally {
      setAssigning(false)
    }
  }

  // ── Unassign book from cell ─────────────────────────────────────────────────
  const unassignBook = async (item: ChallengeItem) => {
    if (!challenge) return
    try {
      await challengesApi.assignBook(challenge.id, item.id, { book_id: null, completed: false })
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === item.id ? { ...i, book_id: null, completed: false, book: null } : i,
              ),
            }
          : null,
      )
    } catch {
      toast.error('Erro ao remover livro')
    }
  }

  // ── Derived: sorted items + winning positions ────────────────────────────────
  const items = useMemo(
    () => [...(challenge?.items ?? [])].sort((a, b) => a.position - b.position),
    [challenge],
  )
  const winningPositions = useMemo(() => getWinningPositions(items), [items])
  const completedCount = items.filter((i) => i.completed).length
  const winCount = LINES.filter((line) => line.every((p) => winningPositions.has(p))).length

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-2 mt-6">
          {Array.from({ length: 25 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-[#2C1810]">Bingo Literário</h1>
            <p className="text-sm text-[#7A6358] mt-0.5">Complete linhas, colunas e diagonais lendo livros.</p>
          </div>
          {challenge && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9B99A] text-[#7A6358] text-sm hover:bg-[#E8DDD0] transition-colors"
            >
              <RotateCcw size={15} /> Novo Bingo
            </button>
          )}
        </div>

        {/* No challenge yet */}
        {!challenge ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-20 h-20 rounded-full bg-[#E8DDD0] flex items-center justify-center">
              <Grid3X3 size={36} className="text-[#C9B99A]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#2C1810] mb-1">Nenhum bingo ativo</p>
              <p className="text-sm text-[#7A6358]">Crie um bingo literário para começar a jogar.</p>
            </div>
            <button
              onClick={createBingo}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B3A52] text-white text-sm font-medium hover:bg-[#7A2D42] transition-colors disabled:opacity-60"
            >
              <Plus size={16} /> {creating ? 'Criando...' : 'Criar Bingo'}
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-white border border-[#E8DDD0] rounded-xl px-4 py-2.5">
                <span className="text-xs text-[#7A6358]">Marcados</span>
                <p className="text-lg font-bold text-[#2C1810]">{completedCount}/25</p>
              </div>
              <div className="bg-white border border-[#E8DDD0] rounded-xl px-4 py-2.5">
                <span className="text-xs text-[#7A6358]">Linhas completas</span>
                <p className="text-lg font-bold text-[#8B3A52]">{winCount}</p>
              </div>
              <div className="bg-white border border-[#E8DDD0] rounded-xl px-4 py-2.5">
                <span className="text-xs text-[#7A6358]">Ano</span>
                <p className="text-lg font-bold text-[#2C1810]">{challenge.year}</p>
              </div>
            </div>

            {/* 5×5 Grid */}
            <div className="grid grid-cols-5 gap-2">
              {items.map((item) => {
                const isWinning = winningPositions.has(item.position)
                return (
                  <button
                    key={item.id}
                    onClick={() => item.completed ? unassignBook(item) : setPickerItem(item)}
                    className={`
                      relative aspect-square rounded-xl overflow-hidden text-left transition-all
                      ${isWinning
                        ? 'border-2 border-yellow-400 shadow-[0_0_0_2px_rgba(250,204,21,0.3)]'
                        : 'border border-[#E8DDD0]'
                      }
                      ${item.completed
                        ? 'bg-[#8B3A52]'
                        : 'bg-white hover:border-[#8B3A52]/40 hover:shadow-sm'
                      }
                    `}
                  >
                    {item.completed ? (
                      <>
                        {item.book?.cover_url && (
                          <img
                            src={item.book.cover_url}
                            alt={item.book.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                          />
                        )}
                        <div className="relative p-2 h-full flex flex-col justify-end">
                          <p className="text-white text-[10px] font-medium leading-tight line-clamp-3">
                            {item.book?.title ?? item.slot_label}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 h-full flex flex-col justify-center">
                        <p className="text-[#7A6358] text-[10px] leading-tight line-clamp-4 text-center">
                          {item.slot_label}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-[#C9B99A] text-center">
              Clique em uma célula vazia para atribuir um livro · Clique em uma célula marcada para remover
            </p>
          </>
        )}
      </div>

      {/* Book picker modal */}
      {pickerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-display text-[#2C1810]">Atribuir livro</h2>
                <p className="text-xs text-[#7A6358] mt-0.5">{pickerItem.slot_label}</p>
              </div>
              <button
                onClick={() => setPickerItem(null)}
                className="p-1 rounded-lg hover:bg-[#E8DDD0] text-[#7A6358]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9B99A]" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Buscar livro por título ou autor..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {searchLoading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : bookResults.length === 0 ? (
                <p className="text-sm text-[#C9B99A] text-center py-8">Nenhum livro encontrado.</p>
              ) : (
                bookResults.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => assignBook(book)}
                    disabled={assigning}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FAF7F2] text-left transition-colors disabled:opacity-60"
                  >
                    <div className="w-8 h-10 rounded flex-shrink-0 overflow-hidden bg-[#E8DDD0]">
                      {book.cover_url
                        ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#C9B99A]">
                            {book.title.slice(0, 2).toUpperCase()}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2C1810] truncate">{book.title}</p>
                      <p className="text-xs text-[#7A6358] truncate">{book.author}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      <ConfirmModal
        open={showResetModal}
        title="Reiniciar Bingo"
        description="Isso vai apagar todo o progresso atual e criar um novo bingo vazio. Essa ação não pode ser desfeita."
        confirmLabel={resetting ? 'Reiniciando...' : 'Reiniciar'}
        danger
        onConfirm={resetBingo}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  )
}
