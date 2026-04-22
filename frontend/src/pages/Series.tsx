import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BookOpen, Layers } from 'lucide-react'
import { booksApi } from '@/api/books'
import type { Book } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

type Tab = 'series' | 'trilogias'

function groupBySeries(books: Book[]): Record<string, Book[]> {
  const groups: Record<string, Book[]> = {}
  for (const book of books) {
    const key = book.series_name ?? 'Sem série'
    if (!groups[key]) groups[key] = []
    groups[key].push(book)
  }
  for (const key in groups) {
    groups[key].sort((a, b) => (a.series_position ?? 0) - (b.series_position ?? 0))
  }
  return groups
}

function BookCover({ book, size = 'md' }: { book: Book | null; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-16 h-24' : 'w-24 h-36'
  return (
    <Link
      to={book ? `/biblioteca/${book.id}` : '#'}
      className={`${dims} rounded-xl overflow-hidden bg-[#E8DDD0] flex-shrink-0 shadow-sm block hover:shadow-md transition-shadow ${!book ? 'cursor-default' : ''}`}
    >
      {book?.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
          <BookOpen size={book ? 20 : 16} className="text-[#C9B99A]" />
          {book && (
            <p className="text-[8px] text-[#C9B99A] text-center leading-tight line-clamp-3">
              {book.title}
            </p>
          )}
        </div>
      )}
    </Link>
  )
}

export default function Series() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('series')

  useEffect(() => {
    booksApi.list({ limit: 50, sort_by: 'title', sort_order: 'asc' })
      .then(({ data }) => {
        setBooks((data as { books?: Book[] }).books ?? [])
      })
      .catch(() => toast.error('Erro ao carregar livros'))
      .finally(() => setLoading(false))
  }, [])

  const seriesBooks = useMemo(
    () => books.filter((b) => b.series_name && b.series_name.trim() !== ''),
    [books],
  )
  const trilogiaBooks = useMemo(
    () => books.filter((b) => b.is_trilogy),
    [books],
  )

  const seriesGroups = useMemo(() => groupBySeries(seriesBooks), [seriesBooks])
  const trilogiaGroups = useMemo(() => groupBySeries(trilogiaBooks), [trilogiaBooks])

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-[#2C1810]">Séries e Trilogias</h1>
          <p className="text-sm text-[#7A6358] mt-0.5">Seus livros agrupados por série e trilogia.</p>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-[#E8DDD0] rounded-xl p-1 w-fit">
          {(['series', 'trilogias'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-[#8B3A52] shadow-sm'
                  : 'text-[#7A6358] hover:text-[#2C1810]'
              }`}
            >
              {t === 'series' ? 'Todas as séries' : 'Trilogias'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="w-24 h-36 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'series' ? (
          /* ── Series tab ─────────────────────────────────────────── */
          Object.keys(seriesGroups).length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Nenhuma série encontrada"
              description="Adicione livros com nome de série para vê-los agrupados aqui."
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(seriesGroups).map(([name, group]) => (
                <div key={name}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h2 className="font-semibold text-[#2C1810]">{name}</h2>
                    <span className="text-xs text-[#C9B99A]">{group.length} livro{group.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {group.map((book) => (
                      <div key={book.id} className="flex flex-col items-center gap-1.5">
                        <BookCover book={book} />
                        <div className="w-24 text-center">
                          {book.series_position && (
                            <p className="text-[10px] text-[#C9B99A]">#{book.series_position}</p>
                          )}
                          <p className="text-xs text-[#7A6358] line-clamp-2 leading-tight">{book.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Trilogias tab ──────────────────────────────────────── */
          Object.keys(trilogiaGroups).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Nenhuma trilogia encontrada"
              description="Marque livros como trilogia ao adicioná-los ou editá-los."
            />
          ) : (
            <div className="space-y-10">
              {Object.entries(trilogiaGroups).map(([name, group]) => {
                // Show up to 3 slots; fill with actual books or empty
                const slots = [group[0] ?? null, group[1] ?? null, group[2] ?? null]
                return (
                  <div key={name}>
                    <h2 className="font-semibold text-[#2C1810] mb-4">{name}</h2>
                    {/* 3-slot connected layout */}
                    <div className="flex items-center gap-0">
                      {slots.map((book, i) => (
                        <div key={i} className="flex items-center">
                          {i > 0 && (
                            <div className="w-8 h-0.5 bg-[#8B3A52]" />
                          )}
                          <div className="flex flex-col items-center gap-1.5">
                            <BookCover book={book} />
                            <p className="text-[10px] text-[#C9B99A] w-24 text-center">
                              {book ? book.title : `Livro ${i + 1}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {/* Extra books beyond 3 */}
                      {group.slice(3).map((book, i) => (
                        <div key={book.id} className="flex items-center">
                          <div className="w-8 h-0.5 bg-[#8B3A52]" />
                          <div className="flex flex-col items-center gap-1.5">
                            <BookCover book={book} />
                            <p className="text-[10px] text-[#C9B99A] w-24 text-center">{book.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
