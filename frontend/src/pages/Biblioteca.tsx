import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, BookPlus, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { booksApi } from '@/api/books'
import type { Book, Pagination } from '@/types'
import { useAuthStore } from '@/store/authStore'
import BookCard from '@/components/shared/BookCard'
import BookCardList from '@/components/shared/BookCardList'
import GenreSelect from '@/components/shared/GenreSelect'
import ConfirmModal from '@/components/shared/ConfirmModal'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'
import { BookOpen } from 'lucide-react'

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'lendo', label: 'Lendo' },
  { value: 'lido', label: 'Lido' },
  { value: 'quero_ler', label: 'Quero Ler' },
  { value: 'abandonado', label: 'Abandonado' },
]

const SORT_OPTIONS = [
  { value: 'updated_at:desc', label: 'Mais recentes' },
  { value: 'title:asc', label: 'Título A-Z' },
  { value: 'rating:desc', label: 'Avaliação' },
]

const DEFAULT_PAGINATION: Pagination = { total: 0, page: 1, limit: 20, total_pages: 0 }

function SkeletonCard() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8DDD0]">
      <Skeleton className="w-[60px] h-[90px] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}

export default function Biblioteca() {
  const { isPro } = useAuthStore()
  const navigate = useNavigate()

  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [genre, setGenre] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sort, setSort] = useState('updated_at:desc')
  const [page, setPage] = useState(1)

  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  // Fetch books on filter changes
  useEffect(() => {
    const [sort_by, sort_order] = sort.split(':')
    setIsLoading(true)
    booksApi.list({
      search: debouncedSearch || undefined,
      status: status || undefined,
      genre: genre || undefined,
      rating: ratingFilter ?? undefined,
      sort_by,
      sort_order: sort_order as 'asc' | 'desc',
      page,
      limit: 20,
    })
      .then(({ data }) => {
        const d = data as { books?: Book[]; pagination?: Pagination }
        setBooks(d.books ?? [])
        setPagination(d.pagination ?? DEFAULT_PAGINATION)
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        toast.error(msg ?? 'Erro ao carregar livros')
      })
      .finally(() => setIsLoading(false))
  }, [debouncedSearch, status, genre, ratingFilter, sort, page])

  const hasFilters = !!(debouncedSearch || status || genre || ratingFilter)

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatus('')
    setGenre('')
    setRatingFilter(null)
    setSort('updated_at:desc')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await booksApi.delete(deleteTarget.id)
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
      toast.success('Livro excluído.')
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao excluir livro.')
    } finally {
      setDeleting(false)
    }
  }

  const showFreeBanner = !isPro && pagination.total >= 10

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F2]">
      {/* Sticky filter bar */}
      <div className="sticky top-0 lg:top-0 z-10 bg-[#FAF7F2] border-b border-[#E8DDD0] px-6 py-4 space-y-3">
        {/* Row 1 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9B99A]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou autor..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#E8DDD0] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-[#8B3A52] shadow-sm' : 'text-[#7A6358]'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-[#8B3A52] shadow-sm' : 'text-[#7A6358]'}`}
            >
              <List size={16} />
            </button>
          </div>
          <Link
            to="/adicionar"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#8B3A52] text-white rounded-lg text-sm font-medium hover:bg-[#6E2D40] transition-colors whitespace-nowrap"
          >
            <BookPlus size={15} />
            <span className="hidden sm:inline">Adicionar</span>
          </Link>
        </div>

        {/* Row 2 — filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  status === tab.value
                    ? 'bg-[#8B3A52] text-white'
                    : 'bg-[#E8DDD0] text-[#7A6358] hover:bg-[#C9B99A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Genre */}
            <div className="w-40">
              <GenreSelect value={genre} onChange={(v) => { setGenre(v); setPage(1) }} />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A52]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Rating filter */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => { setRatingFilter(prev => prev === n ? null : n); setPage(1) }}
                  className="transition-colors"
                >
                  <Star
                    size={16}
                    className={n <= (ratingFilter ?? 0) ? 'text-[#8B3A52]' : 'text-[#C9B99A]'}
                    fill={n <= (ratingFilter ?? 0) ? '#8B3A52' : 'transparent'}
                  />
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#8B3A52] hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FREE banner */}
      {showFreeBanner && (
        <div className="mx-6 mt-4 flex items-center justify-between gap-4 px-4 py-3 bg-[#F5ECF0] border border-[#8B3A52]/20 rounded-xl text-sm">
          <p className="text-[#2C1810]">
            Você atingiu o limite de <strong>10 livros</strong> do plano gratuito.
          </p>
          <Link
            to="/assinatura"
            className="px-3 py-1.5 bg-[#8B3A52] text-white rounded-lg text-xs font-medium whitespace-nowrap hover:bg-[#6E2D40] transition-colors"
          >
            Ver planos
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Results count */}
        {!isLoading && books.length > 0 && (
          <p className="text-xs text-[#7A6358] mb-4">
            Exibindo {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} de {pagination.total} livros
          </p>
        )}

        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonListItem key={i} />)}
            </div>
          )
        ) : books.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="Nenhum livro encontrado"
              description="Tente ajustar os filtros."
              action={{ label: 'Limpar filtros', onClick: clearFilters }}
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Você ainda não adicionou nenhum livro"
              description="Comece adicionando seu primeiro livro à biblioteca."
              action={{ label: 'Adicionar primeiro livro', onClick: () => navigate('/adicionar') }}
            />
          )
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {books.map((book) => <BookCard key={book.id} book={book} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book, i) => (
              <div key={book.id}>
                <BookCardList
                  book={book}
                  onEdit={() => navigate(`/biblioteca/${book.id}`)}
                  onDelete={() => setDeleteTarget(book)}
                />
                {i < books.length - 1 && <div className="h-px bg-[#E8DDD0]" />}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-[#E8DDD0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#7A6358]"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pagination.total_pages)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 text-[#C9B99A] text-sm">…</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-[#8B3A52] text-white'
                        : 'text-[#7A6358] hover:bg-[#E8DDD0]'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page === pagination.total_pages}
              className="p-2 rounded-lg hover:bg-[#E8DDD0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#7A6358]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir livro"
        description={`Tem certeza que deseja excluir "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
