import { create } from 'zustand'
import type { Book } from '@/types'

interface BookState {
  books: Book[]
  totalBooks: number
  isLoading: boolean
  setBooks: (books: Book[], total: number) => void
  addBook: (book: Book) => void
  updateBook: (book: Book) => void
  removeBook: (id: string) => void
  clearBooks: () => void
}

export const useBookStore = create<BookState>()((set) => ({
  books: [],
  totalBooks: 0,
  isLoading: false,

  setBooks: (books, total) => set({ books, totalBooks: total }),
  addBook: (book) => set((s) => ({ books: [book, ...s.books], totalBooks: s.totalBooks + 1 })),
  updateBook: (book) =>
    set((s) => ({ books: s.books.map((b) => (b.id === book.id ? book : b)) })),
  removeBook: (id) =>
    set((s) => ({ books: s.books.filter((b) => b.id !== id), totalBooks: s.totalBooks - 1 })),
  clearBooks: () => set({ books: [], totalBooks: 0 }),
}))
