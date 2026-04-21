import { useState, useCallback } from 'react'
import { booksApi, type ListBooksParams } from '@/api/books'
import type { Book, Pagination } from '@/types'

const DEFAULT_PAGINATION: Pagination = { total: 0, page: 1, limit: 20, total_pages: 0 }

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = useCallback(async (filters?: ListBooksParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await booksApi.list(filters)
      const bookList: Book[] = (data as { books?: Book[] }).books ?? []
      const pag: Pagination = (data as { pagination?: Pagination }).pagination ?? {
        ...DEFAULT_PAGINATION,
        total: bookList.length,
        total_pages: 1,
      }
      setBooks(bookList)
      setPagination(pag)
      return { books: bookList, pagination: pag }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao buscar livros'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { books, setBooks, pagination, isLoading, error, fetchBooks }
}
