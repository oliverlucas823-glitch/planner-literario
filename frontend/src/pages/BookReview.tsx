import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BookOpen, ThumbsUp, ThumbsDown, Heart, Trash2, Quote, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { booksApi } from '@/api/books'
import { readingDaysApi } from '@/api/reading-days'
import { useAuthStore } from '@/store/authStore'
import type { Book } from '@/types'
import StarRating from '@/components/shared/StarRating'
import HeartRating from '@/components/shared/HeartRating'
import EmojiSelector from '@/components/shared/EmojiSelector'
import ProgressBar from '@/components/shared/ProgressBar'
import FormatToggle from '@/components/shared/FormatToggle'
import GenreSelect from '@/components/shared/GenreSelect'
import StatusBadge from '@/components/shared/StatusBadge'
import ReadingCalendar from '@/components/shared/ReadingCalendar'
import CoverUpload from '@/components/shared/CoverUpload'
import ConfirmModal from '@/components/shared/ConfirmModal'
import { Skeleton } from '@/components/shared/Skeleton'

type ReadingDay = { id: string; read_date: string }
type Status = Book['status']

const STATUS_OPTIONS: Status[] = ['lendo', 'lido', 'quero_ler', 'abandonado']
const STATUS_LABELS: Record<Status, string> = { lendo: 'Lendo', lido: 'Lido', quero_ler: 'Quero Ler', abandonado: 'Abandonado' }

const CRITERIOS_POR_GENERO: Record<string, string[]> = {
  'Romance': ['Plot', 'Personagens', 'Romance', 'Escrita fluida'],
  'Ficção Científica': ['Plot', 'Worldbuilding', 'Personagens', 'Escrita fluida'],
  'Fantasia': ['Plot', 'Worldbuilding', 'Personagens', 'Escrita fluida'],
  'Mistério': ['Plot', 'Suspense', 'Resolução', 'Escrita fluida'],
  'Terror': ['Atmosfera', 'Suspense', 'Personagens', 'Escrita fluida'],
  'Thriller': ['Plot', 'Suspense', 'Ritmo', 'Escrita fluida'],
  'Clássico': ['Plot', 'Personagens', 'Estilo literário', 'Relevância'],
  'Biografia': ['Autenticidade', 'Narrativa', 'Profundidade', 'Escrita fluida'],
  'Autoajuda': ['Aplicabilidade', 'Clareza', 'Exemplos práticos', 'Escrita fluida'],
  'História': ['Precisão', 'Narrativa', 'Profundidade', 'Escrita fluida'],
  'Poesia': ['Linguagem', 'Emoção', 'Originalidade', 'Impacto'],
  'Conto': ['Plot', 'Personagens', 'Conclusão', 'Escrita fluida'],
  'Distopia': ['Plot', 'Worldbuilding', 'Crítica social', 'Personagens'],
  'Literatura Brasileira': ['Plot', 'Personagens', 'Contexto cultural', 'Escrita fluida'],
  'Outro': ['Critério 1', 'Critério 2', 'Critério 3', 'Escrita fluida'],
  'default': ['Plot', 'Personagens', 'Final', 'Escrita fluida'],
}

const RATING_KEYS: (keyof Book)[] = ['rating_plot', 'rating_characters', 'rating_ending', 'rating_writing']

export default function BookReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isPro } = useAuthStore()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showCoverUpload, setShowCoverUpload] = useState(false)

  // Progress by page
  const [currentPage, setCurrentPage] = useState(0)

  // Quotes
  const [quotes, setQuotes] = useState<string[]>([])
  const [showAddQuote, setShowAddQuote] = useState(false)
  const [newQuote, setNewQuote] = useState('')

  // Explicit save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calDays, setCalDays] = useState<ReadingDay[]>([])

  // Auto-save
  const pendingPatch = useRef<Record<string, unknown>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load book
  useEffect(() => {
    if (!id) return
    booksApi.get(id)
      .then(({ data }) => {
        const b = (data as { book?: Book }).book ?? (data as Book)
        setBook(b)
      })
      .catch(() => toast.error('Erro ao carregar livro'))
      .finally(() => setLoading(false))
  }, [id])

  // Initialize derived state from book on first load
  useEffect(() => {
    if (!book) return
    if (book.pages) {
      setCurrentPage(Math.round((book.progress / 100) * book.pages))
    }
    setQuotes(book.favorite_quote ? book.favorite_quote.split('|||').filter(Boolean) : [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id])

  // Load calendar days for current month
  useEffect(() => {
    if (!id) return
    readingDaysApi.list({ book_id: id, year: calYear, month: calMonth + 1 })
      .then(({ data }) => {
        const days = (data as { reading_days?: ReadingDay[] }).reading_days ?? []
        setCalDays(days)
      })
      .catch(() => {})
  }, [id, calYear, calMonth])

  const calDates = useMemo(() => calDays.map((d) => d.read_date.slice(0, 10)), [calDays])

  // Auto-save field patch
  const updateField = useCallback((patch: Partial<Book>) => {
    setBook((prev) => (prev ? { ...prev, ...patch } : null))
    Object.assign(pendingPatch.current, patch)
    setHasUnsavedChanges(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const toSave = { ...pendingPatch.current }
      pendingPatch.current = {}
      try {
        await booksApi.update(id!, toSave)
        setHasUnsavedChanges(false)
        toast.success('Salvo', { duration: 1000, position: 'bottom-left' })
      } catch {
        // silent — non-blocking auto-save
      }
    }, 1500)
  }, [id])

  const saveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const toSave = { ...pendingPatch.current }
    pendingPatch.current = {}
    if (Object.keys(toSave).length === 0) return
    setSaving(true)
    try {
      await booksApi.update(id!, toSave)
      setHasUnsavedChanges(false)
      toast.success('Salvo com sucesso')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const saveQuotes = useCallback((newQuotes: string[]) => {
    const joined = newQuotes.join('|||')
    updateField({ favorite_quote: joined || null })
  }, [updateField])

  // Toggle reading day (optimistic)
  const toggleDay = async (dateStr: string) => {
    const existing = calDays.find((d) => d.read_date.slice(0, 10) === dateStr)

    if (existing) {
      setCalDays((prev) => prev.filter((d) => d.id !== existing.id))
      try {
        await readingDaysApi.delete(existing.id)
      } catch {
        setCalDays((prev) => [...prev, existing])
        toast.error('Erro ao remover dia')
      }
    } else {
      const temp: ReadingDay = { id: `_temp_${dateStr}`, read_date: dateStr }
      setCalDays((prev) => [...prev, temp])
      try {
        const { data } = await readingDaysApi.create(id!, dateStr)
        const saved: ReadingDay = (data as { reading_day?: ReadingDay }).reading_day ?? (data as ReadingDay)
        setCalDays((prev) => prev.map((d) => (d.id === temp.id ? saved : d)))
      } catch {
        setCalDays((prev) => prev.filter((d) => d.id !== temp.id))
        toast.error('Erro ao marcar dia')
      }
    }
  }

  // Favorite toggle (optimistic)
  const toggleFavorite = async () => {
    if (!book) return
    const newVal = !book.is_favorite
    setBook((p) => (p ? { ...p, is_favorite: newVal } : null))
    try {
      await booksApi.update(id!, { is_favorite: newVal })
    } catch {
      setBook((p) => (p ? { ...p, is_favorite: !newVal } : null))
      toast.error('Erro ao atualizar favorito')
    }
  }

  // Recommend toggle (optimistic)
  const toggleRecommend = async (val: boolean) => {
    if (!book) return
    const newVal = book.would_recommend === val ? null : val
    setBook((p) => (p ? { ...p, would_recommend: newVal } : null))
    try {
      await booksApi.update(id!, { would_recommend: newVal })
    } catch {
      setBook((p) => (p ? { ...p, would_recommend: book.would_recommend } : null))
      toast.error('Erro ao salvar')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await booksApi.delete(id!)
      toast.success('Livro excluído.')
      navigate('/biblioteca')
    } catch {
      toast.error('Erro ao excluir livro.')
    } finally {
      setDeleting(false)
    }
  }

  const handleCoverFile = async (file: File) => {
    if (!isPro || !id) return
    try {
      const { data } = await booksApi.uploadCover(id, file)
      const updated = (data as { book?: Book }).book
      if (updated?.cover_url) setBook((p) => (p ? { ...p, cover_url: updated.cover_url } : null))
      else {
        const url = (data as { cover_url?: string }).cover_url
        if (url) setBook((p) => (p ? { ...p, cover_url: url } : null))
      }
      toast.success('Capa atualizada!')
      setShowCoverUpload(false)
    } catch {
      toast.error('Erro ao enviar capa')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto">
        <div className="lg:w-80 space-y-4">
          <Skeleton className="aspect-[2/3] w-48 mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="p-8 text-center text-[#7A6358]">
        <p>Livro não encontrado.</p>
        <Link to="/biblioteca" className="text-[#8B3A52] hover:underline mt-2 inline-block">
          Voltar à biblioteca
        </Link>
      </div>
    )
  }

  const criterios = CRITERIOS_POR_GENERO[book.genre ?? ''] ?? CRITERIOS_POR_GENERO['default']

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="px-6 pt-6 pb-2">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#7A6358] mb-6">
          <Link to="/biblioteca" className="hover:text-[#8B3A52] transition-colors">Biblioteca</Link>
          <span>/</span>
          <span className="text-[#2C1810] truncate max-w-xs">{book.title}</span>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-6 pb-10 max-w-6xl">
        {/* LEFT COLUMN */}
        <div className="lg:w-80 flex-shrink-0 space-y-6">
          {/* Cover */}
          <div className="space-y-3">
            <div className="relative w-48 mx-auto lg:w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#E8DDD0] shadow-md group">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <BookOpen size={40} className="text-[#C9B99A]" />
                  <p className="text-xs text-[#C9B99A] text-center px-2 font-medium">
                    {book.title.slice(0, 2).toUpperCase()}
                  </p>
                </div>
              )}
              <button
                onClick={() => isPro ? setShowCoverUpload(true) : toast.error('Upload de capa disponível no plano PRO')}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <span className="text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg">
                  {isPro ? 'Trocar capa' : '🔒 PRO'}
                </span>
              </button>
            </div>

            {showCoverUpload && isPro && (
              <CoverUpload
                value={book.cover_url}
                onChange={handleCoverFile}
                onRemove={() => { updateField({ cover_url: null }); setShowCoverUpload(false) }}
              />
            )}
          </div>

          {/* Star rating + genre-based detail ratings */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-2">Avaliação</p>
              <StarRating
                value={book.rating ?? 0}
                onChange={(v) => updateField({ rating: v })}
                size="lg"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">Detalhes</p>
              <div className="space-y-2.5">
                {criterios.map((label, i) => (
                  <div key={RATING_KEYS[i]} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[#7A6358] flex-shrink-0 w-28">{label}</span>
                    <HeartRating
                      value={(book[RATING_KEYS[i]] as number) ?? 0}
                      onChange={(v) => updateField({ [RATING_KEYS[i]]: v })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotions */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-4">
            <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">Como foi ler?</p>
            <EmojiSelector
              selected={book.emotions ?? []}
              onChange={(v) => updateField({ emotions: v })}
            />
          </div>

          {/* Reading calendar */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide">
                Dias lidos <span className="font-normal">({calDays.length} este mês)</span>
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const d = new Date(calYear, calMonth - 1)
                    setCalYear(d.getFullYear())
                    setCalMonth(d.getMonth())
                  }}
                  className="p-1 rounded hover:bg-[#E8DDD0] text-[#7A6358]"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => {
                    const d = new Date(calYear, calMonth + 1)
                    setCalYear(d.getFullYear())
                    setCalMonth(d.getMonth())
                  }}
                  className="p-1 rounded hover:bg-[#E8DDD0] text-[#7A6358]"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <ReadingCalendar
              year={calYear}
              month={calMonth}
              readDates={calDates}
              onToggle={toggleDay}
            />
          </div>

          {/* Would recommend */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-4">
            <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">
              Recomendaria este livro?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleRecommend(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  book.would_recommend === true
                    ? 'bg-[#8B3A52] text-white'
                    : 'bg-[#E8DDD0] text-[#7A6358] hover:bg-[#C9B99A]'
                }`}
              >
                <ThumbsUp size={15} /> Sim
              </button>
              <button
                onClick={() => toggleRecommend(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  book.would_recommend === false
                    ? 'bg-[#8B3A52] text-white'
                    : 'bg-[#E8DDD0] text-[#7A6358] hover:bg-[#C9B99A]'
                }`}
              >
                <ThumbsDown size={15} /> Não
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 space-y-5">
          {/* Title + author + status */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-6">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1">
                <input
                  value={book.title}
                  onChange={(e) => updateField({ title: e.target.value })}
                  className="w-full font-display text-3xl font-bold text-[#2C1810] bg-transparent border-none outline-none focus:bg-[#FAF7F2] focus:px-2 rounded transition-all placeholder:text-[#C9B99A]"
                  placeholder="Título do livro"
                />
                <input
                  value={book.author}
                  onChange={(e) => updateField({ author: e.target.value })}
                  className="w-full text-lg text-[#7A6358] bg-transparent border-none outline-none focus:bg-[#FAF7F2] focus:px-2 rounded mt-1 transition-all placeholder:text-[#C9B99A]"
                  placeholder="Autor"
                />
              </div>
              <div className="relative">
                <button onClick={() => setShowStatusMenu((s) => !s)}>
                  <StatusBadge status={book.status} />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-white border border-[#E8DDD0] rounded-xl shadow-lg overflow-hidden min-w-32">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { updateField({ status: s }); setShowStatusMenu(false) }}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-[#FAF7F2] transition-colors ${
                          s === book.status ? 'font-semibold text-[#8B3A52]' : 'text-[#2C1810]'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info fields */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-6">
            <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-4">Informações</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7A6358] mb-1">Gênero</label>
                <GenreSelect value={book.genre ?? ''} onChange={(v) => updateField({ genre: v || null })} />
              </div>
              <div>
                <label className="block text-xs text-[#7A6358] mb-1">Nº de páginas</label>
                <input
                  type="number"
                  min={1}
                  value={book.pages ?? ''}
                  onChange={(e) => updateField({ pages: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                  placeholder="Ex: 320"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-[#7A6358] mb-1">Formato</label>
                <FormatToggle
                  value={book.format}
                  onChange={(v) => updateField({ format: v })}
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A6358] mb-1">Data de início</label>
                <input
                  type="date"
                  value={book.start_date?.slice(0, 10) ?? ''}
                  onChange={(e) => updateField({ start_date: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                />
              </div>
              {book.status === 'lido' && (
                <div>
                  <label className="block text-xs text-[#7A6358] mb-1">Data de término</label>
                  <input
                    type="date"
                    value={book.end_date?.slice(0, 10) ?? ''}
                    onChange={(e) => updateField({ end_date: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-6">
            <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">
              Progresso de leitura
            </p>
            {book.pages ? (
              <div>
                <label className="block text-xs text-[#7A6358] mb-1">Página atual</label>
                <input
                  type="number"
                  min={0}
                  max={book.pages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = Math.min(Math.max(0, Number(e.target.value)), book.pages!)
                    setCurrentPage(val)
                    const pct = Math.round((val / book.pages!) * 100)
                    updateField({ progress: pct })
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                />
                <p className="text-xs text-[#7A6358] mt-2">
                  Página {currentPage} de {book.pages} ({Math.round((currentPage / book.pages) * 100)}%)
                </p>
              </div>
            ) : (
              <ProgressBar
                value={book.progress}
                onChange={(v) => updateField({ progress: v })}
              />
            )}
          </div>

          {/* Review */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-6">
            <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide mb-3">Minha resenha</p>
            <div className="relative">
              <textarea
                value={book.review ?? ''}
                onChange={(e) => updateField({ review: e.target.value })}
                maxLength={5000}
                rows={6}
                placeholder="Escreva o que você achou do livro..."
                className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm resize-none"
                style={{ minHeight: '140px' }}
              />
              <span className="absolute bottom-3 right-3 text-xs text-[#C9B99A]">
                {(book.review ?? '').length}/5000
              </span>
            </div>
          </div>

          {/* Favorite quotes */}
          <div className="bg-white rounded-xl border border-[#E8DDD0] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Quote size={14} className="text-[#C9B99A]" />
              <p className="text-xs font-semibold text-[#7A6358] uppercase tracking-wide">Citações favoritas</p>
            </div>

            {quotes.length > 0 && (
              <div className="space-y-2 mb-3">
                {quotes.map((q, i) => (
                  <div key={i} className="bg-[#FAF7F2] border border-[#8B3A52]/30 rounded-lg p-3 flex items-start gap-2">
                    <p className="text-sm text-[#2C1810] italic flex-1">{q}</p>
                    <button
                      onClick={() => {
                        const updated = quotes.filter((_, idx) => idx !== i)
                        setQuotes(updated)
                        saveQuotes(updated)
                      }}
                      className="text-[#C9B99A] hover:text-red-400 flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddQuote ? (
              <div>
                <textarea
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  rows={3}
                  placeholder="Digite a citação..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-[#FAF7F2] text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm resize-none italic mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!newQuote.trim()) return
                      const updated = [...quotes, newQuote.trim()]
                      setQuotes(updated)
                      saveQuotes(updated)
                      setNewQuote('')
                      setShowAddQuote(false)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#8B3A52] text-white text-xs font-medium hover:bg-[#7A2D42] transition-colors"
                  >
                    Salvar citação
                  </button>
                  <button
                    onClick={() => { setShowAddQuote(false); setNewQuote('') }}
                    className="px-3 py-1.5 rounded-lg border border-[#C9B99A] text-[#7A6358] text-xs hover:bg-[#FAF7F2] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddQuote(true)}
                className="text-sm text-[#8B3A52] hover:underline"
              >
                + Adicionar citação
              </button>
            )}
          </div>

          {/* Explicit save button */}
          <div className="flex justify-end">
            <button
              onClick={saveNow}
              disabled={!hasUnsavedChanges || saving}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                hasUnsavedChanges
                  ? 'bg-[#8B3A52] text-white hover:bg-[#7A2D42]'
                  : 'bg-green-50 text-green-700 border border-green-200 cursor-default'
              }`}
            >
              {saving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar alterações' : '✓ Salvo'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                book.is_favorite
                  ? 'border-[#8B3A52] bg-[#F5ECF0] text-[#8B3A52]'
                  : 'border-[#C9B99A] text-[#7A6358] hover:border-[#8B3A52] hover:text-[#8B3A52]'
              }`}
            >
              <Heart size={16} fill={book.is_favorite ? '#8B3A52' : 'transparent'} />
              {book.is_favorite ? 'Favoritado' : 'Adicionar aos favoritos'}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-transparent text-sm font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors ml-auto"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Excluir livro"
        description={`Tem certeza que deseja excluir "${book.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
