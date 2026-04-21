import { BookOpen, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type Book } from '@/types'
import StatusBadge from './StatusBadge'

interface Props {
  book: Book
  onEdit?: (book: Book) => void
  onDelete?: (book: Book) => void
}

export default function BookCardList({ book, onEdit, onDelete }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8DDD0] hover:border-[#C9B99A] transition-colors group">
      <div
        className="w-[60px] h-[90px] flex-shrink-0 rounded-lg overflow-hidden bg-[#E8DDD0] cursor-pointer"
        onClick={() => navigate(`/biblioteca/${book.id}`)}
      >
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={22} className="text-[#C9B99A]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-[#2C1810] line-clamp-1 cursor-pointer hover:text-[#8B3A52] transition-colors"
          onClick={() => navigate(`/biblioteca/${book.id}`)}
        >
          {book.title}
        </p>
        {book.author && (
          <p className="text-sm text-[#7A6358] line-clamp-1 mt-0.5">{book.author}</p>
        )}
        <div className="mt-2">
          <StatusBadge status={book.status} />
        </div>
        {book.genre && (
          <p className="text-xs text-[#C9B99A] mt-1">{book.genre}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(book)}
            className="p-2 rounded-lg hover:bg-[#E8DDD0] text-[#7A6358] transition-colors"
          >
            <Pencil size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(book)}
            className="p-2 rounded-lg hover:bg-red-50 text-[#7A6358] hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
