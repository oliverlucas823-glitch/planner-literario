import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'
import { booksApi } from '@/api/books'
import type { Book } from '@/types'
import BookCard from '@/components/shared/BookCard'
import EmptyState from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'

export default function FavoritosLivros() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    booksApi.list({ is_favorite: true, limit: 100 })
      .then(({ data }) => {
        setBooks((data as { books?: Book[] }).books ?? [])
      })
      .catch(() => toast.error('Erro ao carregar livros favoritos'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5ECF0] flex items-center justify-center flex-shrink-0">
            <Heart size={20} className="text-[#8B3A52]" fill="#8B3A52" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[#2C1810]">Livros Favoritos</h1>
            <p className="text-sm text-[#7A6358] mt-0.5">
              {!loading && books.length > 0
                ? `${books.length} livro${books.length !== 1 ? 's' : ''} favoritado${books.length !== 1 ? 's' : ''}`
                : 'Seus livros favoritos'}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhum livro favorito ainda"
            description="Marque livros como favoritos na sua biblioteca."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
