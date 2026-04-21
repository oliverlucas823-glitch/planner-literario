import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { booksApi } from '@/api/books'
import { useAuthStore } from '@/store/authStore'
import GenreSelect from '@/components/shared/GenreSelect'
import FormatToggle from '@/components/shared/FormatToggle'
import CoverUpload from '@/components/shared/CoverUpload'
import StarRating from '@/components/shared/StarRating'

const STATUS_OPTIONS = [
  { value: 'quero_ler', label: 'Quero Ler' },
  { value: 'lendo', label: 'Lendo' },
  { value: 'lido', label: 'Lido' },
  { value: 'abandonado', label: 'Abandonado' },
] as const

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  author: z.string().min(1, 'Autor obrigatório'),
  genre: z.string().optional(),
  pages: z.number().positive('Número inválido').nullable().optional(),
  format: z.enum(['fisico', 'ebook', 'audiobook']).nullable().optional(),
  status: z.enum(['lendo', 'lido', 'abandonado', 'quero_ler']),
  series_name: z.string().nullable().optional(),
  series_position: z.number().positive().nullable().optional(),
  is_trilogy: z.boolean(),
  wishlist: z.boolean(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  review: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface UpgradeModalProps {
  onClose: () => void
  onUpgrade: () => void
}

function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5ECF0] flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-[#8B3A52]" />
        </div>
        <h2 className="text-xl font-bold text-[#2C1810] mb-2">Limite atingido</h2>
        <p className="text-[#7A6358] text-sm mb-6">
          Você atingiu o limite de <strong>10 livros</strong> do plano gratuito.
          Faça upgrade para adicionar livros ilimitados e desbloquear todos os recursos.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#C9B99A] text-[#7A6358] rounded-lg text-sm hover:bg-[#E8DDD0] transition-colors"
          >
            Agora não
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 py-2.5 bg-[#8B3A52] text-white rounded-lg text-sm font-semibold hover:bg-[#6E2D40] transition-colors"
          >
            Ver planos
          </button>
        </div>
      </div>
    </div>
  )
}

const STEP_TITLES = ['Informações básicas', 'Capa e série', 'Detalhes da leitura']
const STEP_1_FIELDS: (keyof FormData)[] = ['title', 'author', 'pages']

export default function AdicionarLivro() {
  const { isPro } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [hasSeries, setHasSeries] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { status: 'quero_ler', is_trilogy: false, wishlist: false },
  })

  const status = watch('status')
  const format = watch('format')
  const rating = watch('rating')
  const isTrilogy = watch('is_trilogy')
  const wishlist = watch('wishlist')

  const handleCoverFile = (file: File) => {
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const goNext = async () => {
    if (step === 0) {
      const ok = await trigger(STEP_1_FIELDS)
      if (!ok) return
    }
    setStep((s) => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        author: data.author,
        genre: data.genre || null,
        pages: data.pages ?? null,
        format: data.format ?? null,
        status: data.status,
        series_name: hasSeries ? (data.series_name ?? null) : null,
        series_position: hasSeries ? (data.series_position ?? null) : null,
        is_trilogy: data.is_trilogy,
        wishlist: data.wishlist,
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        rating: data.rating ?? null,
        review: data.review ?? null,
      }

      const { data: res } = await booksApi.create(payload)
      const book = (res as { book?: { id: string } }).book ?? (res as { id: string })

      if (coverFile && isPro && book.id) {
        try {
          await booksApi.uploadCover(book.id, coverFile)
        } catch {
          // non-critical
        }
      }

      toast.success('Livro adicionado com sucesso!')
      navigate(`/biblioteca/${book.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { upgrade_url?: string } } })?.response?.status
      const upgradeUrl = (err as { response?: { data?: { upgrade_url?: string } } })?.response?.data?.upgrade_url
      if (status === 403 || upgradeUrl) {
        setShowUpgrade(true)
      } else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        toast.error(msg ?? 'Erro ao adicionar livro')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((step + 1) / 3) * 100

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold font-display text-[#2C1810] mb-6">Adicionar Livro</h1>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            {STEP_TITLES.map((title, i) => (
              <span key={i} className={i === step ? 'text-[#8B3A52] font-semibold' : 'text-[#C9B99A]'}>
                {i + 1}. {title}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-[#E8DDD0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B3A52] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1 — Basic info */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Título *</label>
                <input
                  {...register('title')}
                  placeholder="Título do livro"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                />
                {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Autor *</label>
                <input
                  {...register('author')}
                  placeholder="Nome do autor"
                  className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                />
                {errors.author && <p className="text-xs text-red-600 mt-1">{errors.author.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Gênero</label>
                  <GenreSelect
                    value={watch('genre') ?? ''}
                    onChange={(v) => setValue('genre', v)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Nº de páginas</label>
                  <input
                    {...register('pages', { valueAsNumber: true, setValueAs: (v: string) => v === '' ? null : Number(v) })}
                    type="number"
                    min={1}
                    placeholder="Ex: 320"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                  />
                  {errors.pages && <p className="text-xs text-red-600 mt-1">{errors.pages.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Formato</label>
                <FormatToggle value={format ?? null} onChange={(v) => setValue('format', v)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('status', value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        status === value
                          ? 'bg-[#8B3A52] text-white'
                          : 'bg-[#E8DDD0] text-[#7A6358] hover:bg-[#C9B99A]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Cover & series */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#2C1810] mb-2">Capa do livro</label>
                {isPro ? (
                  <CoverUpload
                    value={coverPreview}
                    onChange={handleCoverFile}
                    onRemove={() => { setCoverFile(null); setCoverPreview(null) }}
                  />
                ) : (
                  <div className="relative">
                    <CoverUpload value={null} onChange={() => {}} />
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl gap-2">
                      <Lock size={20} className="text-[#8B3A52]" />
                      <p className="text-xs font-medium text-[#2C1810]">Upload de capa é PRO</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSeries}
                    onChange={(e) => setHasSeries(e.target.checked)}
                    className="w-4 h-4 accent-[#8B3A52]"
                  />
                  <span className="text-sm font-medium text-[#2C1810]">Faz parte de uma série?</span>
                </label>
                {hasSeries && (
                  <div className="grid grid-cols-2 gap-4 pl-7">
                    <div>
                      <label className="block text-xs text-[#7A6358] mb-1">Nome da série</label>
                      <input
                        {...register('series_name')}
                        placeholder="Ex: Harry Potter"
                        className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#7A6358] mb-1">Volume nº</label>
                      <input
                        {...register('series_position', { setValueAs: (v: string) => v === '' ? null : Number(v) })}
                        type="number"
                        min={1}
                        placeholder="1"
                        className="w-full px-3 py-2 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTrilogy}
                    onChange={(e) => setValue('is_trilogy', e.target.checked)}
                    className="w-4 h-4 accent-[#8B3A52]"
                  />
                  <span className="text-sm font-medium text-[#2C1810]">É uma trilogia?</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wishlist}
                    onChange={(e) => setValue('wishlist', e.target.checked)}
                    className="w-4 h-4 accent-[#8B3A52]"
                  />
                  <span className="text-sm font-medium text-[#2C1810]">Adicionar à lista de desejos</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3 — Reading details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-5">
              {(status === 'lendo' || status === 'lido') && (
                <div>
                  <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Data de início</label>
                  <input
                    {...register('start_date')}
                    type="date"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                  />
                </div>
              )}

              {status === 'lido' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Data de término</label>
                    <input
                      {...register('end_date')}
                      type="date"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C1810] mb-2">Avaliação inicial</label>
                    <StarRating
                      value={rating ?? 0}
                      onChange={(v) => setValue('rating', v)}
                      size="lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Primeiras impressões</label>
                    <textarea
                      {...register('review')}
                      rows={4}
                      placeholder="O que você achou do livro?"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] text-sm resize-none"
                    />
                  </div>
                </>
              )}

              {status !== 'lendo' && status !== 'lido' && (
                <div className="py-8 text-center text-[#7A6358] text-sm">
                  <p>Nenhum detalhe adicional para o status selecionado.</p>
                  <p className="text-xs mt-1 text-[#C9B99A]">Você pode preencher depois na página do livro.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#C9B99A] text-[#7A6358] rounded-xl text-sm font-medium hover:bg-[#E8DDD0] transition-colors"
              >
                <ChevronLeft size={16} />
                Voltar
              </button>
            )}
            <div className="flex-1" />
            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#8B3A52] text-white rounded-xl text-sm font-semibold hover:bg-[#6E2D40] transition-colors"
              >
                Próximo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#8B3A52] text-white rounded-xl font-semibold hover:bg-[#6E2D40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar livro'}
              </button>
            )}
          </div>
        </form>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => navigate('/assinatura')}
        />
      )}
    </div>
  )
}
