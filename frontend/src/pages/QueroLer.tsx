import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Play, BookOpen, Heart } from 'lucide-react'
import { booksApi } from '@/api/books'
import type { Book } from '@/types'
import BookCard from '@/components/shared/BookCard'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

type Tab = 'quero_ler' | 'wishlist'

function SkeletonCard() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[2/3] w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function WishlistCard({ book, onClaim }: { book: Book; onClaim: (book: Book) => void }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8DDD0] hover:border-[#C9B99A] transition-colors">
      <div className="w-[48px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-[#E8DDD0]">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={18} className="text-[#C9B99A]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#2C1810] text-sm truncate">{book.title}</p>
        {book.author && <p className="text-xs text-[#7A6358] truncate">{book.author}</p>}
      </div>
      <button
        onClick={() => onClaim(book)}
        className="px-3 py-1.5 bg-[#E8DDD0] text-[#7A6358] rounded-lg text-xs font-medium hover:bg-[#8B3A52] hover:text-white transition-colors whitespace-nowrap"
      >
        Tenho este livro
      </button>
    </div>
  )
}

export default function QueroLer() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('quero_ler')
  const [books, setBooks] = useState<Book[]>([])
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    booksApi.list({ status: 'quero_ler', limit: 50 })
      .then(({ data }) => setBooks((data as { books?: Book[] }).books ?? []))
      .catch(() => toast.error('Erro ao carregar lista'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setWishlistLoading(true)
    booksApi.list({ wishlist: true, limit: 50 })
      .then(({ data }) => setWishlistBooks((data as { books?: Book[] }).books ?? []))
      .catch(() => {})
      .finally(() => setWishlistLoading(false))
  }, [])

  const startReading = async (book: Book) => {
    const today = new Date().toISOString().slice(0, 10)
    try {
      await booksApi.update(book.id, { status: 'lendo', start_date: today })
      setBooks((prev) => prev.filter((b) => b.id !== book.id))
      toast.success(`"${book.title}" movido para Lendo!`)
      navigate(`/biblioteca/${book.id}`)
    } catch {
      toast.error('Erro ao atualizar livro')
    }
  }

  const claimWishlist = async (book: Book) => {
    try {
      await booksApi.update(book.id, { wishlist: false, status: 'quero_ler' })
      setWishlistBooks((prev) => prev.filter((b) => b.id !== book.id))
      setBooks((prev) => [{ ...book, wishlist: false, status: 'quero_ler' }, ...prev])
      toast.success(`"${book.title}" adicionado à lista Quero Ler!`)
    } catch {
      toast.error('Erro ao atualizar livro')
    }
  }

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#E8DDD0]">
        <h1 className="text-2xl font-bold font-display text-[#2C1810] mb-4">Lista de Leitura</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#E8DDD0] rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('quero_ler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'quero_ler' ? 'bg-white text-[#8B3A52] shadow-sm' : 'text-[#7A6358]'
            }`}
          >
            <BookOpen size={15} />
            Quero Ler
            {books.length > 0 && (
              <span className="bg-[#8B3A52] text-white text-xs px-1.5 py-0.5 rounded-full">
                {books.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('wishlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'wishlist' ? 'bg-white text-[#8B3A52] shadow-sm' : 'text-[#7A6358]'
            }`}
          >
            <Heart size={15} />
            Lista de Desejos
            {wishlistBooks.length > 0 && (
              <span className="bg-[#C9B99A] text-white text-xs px-1.5 py-0.5 rounded-full">
                {wishlistBooks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === 'quero_ler' && (
          <>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Sua lista de leituras futuras está vazia"
                description="Adicione livros que você quer ler em breve."
                action={{ label: 'Explorar biblioteca', onClick: () => navigate('/biblioteca') }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {books.map((book) => (
                  <div key={book.id} className="relative group">
                    <BookCard book={book} />
                    <button
                      onClick={(e) => { e.stopPropagation(); startReading(book) }}
                      className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-[#8B3A52] text-white rounded-full text-xs font-medium whitespace-nowrap shadow-md"
                    >
                      <Play size={12} />
                      Começar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'wishlist' && (
          <>
            {wishlistLoading ? (
              <div className="space-y-3 max-w-2xl">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : wishlistBooks.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Sua lista de desejos está vazia"
                description="Marque livros como desejados ao adicioná-los."
                action={{ label: 'Adicionar livro', onClick: () => navigate('/adicionar') }}
              />
            ) : (
              <div className="space-y-3 max-w-2xl">
                {wishlistBooks.map((book) => (
                  <WishlistCard key={book.id} book={book} onClaim={claimWishlist} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
