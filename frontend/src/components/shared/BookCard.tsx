import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type Book } from '@/types'
import StatusBadge from './StatusBadge'

interface Props {
  book: Book
}

export default function BookCard({ book }: Props) {
  const navigate = useNavigate()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/biblioteca/${book.id}`)}
      className="cursor-pointer group"
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#E8DDD0] mb-3 relative shadow-md">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={40} className="text-[#C9B99A]" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={book.status} />
        </div>
      </div>
      <p className="text-sm font-semibold text-[#2C1810] line-clamp-2 leading-snug">
        {book.title}
      </p>
      {book.author && (
        <p className="text-xs text-[#7A6358] mt-0.5 line-clamp-1">{book.author}</p>
      )}
    </motion.div>
  )
}
