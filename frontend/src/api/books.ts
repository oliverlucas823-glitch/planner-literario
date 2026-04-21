import { api } from '@/lib/axios'

export interface ListBooksParams {
  status?: string
  genre?: string
  rating?: number
  search?: string
  is_favorite?: boolean
  wishlist?: boolean
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const booksApi = {
  list: (params?: ListBooksParams) =>
    api.get('/api/books', { params }),

  create: (data: Record<string, unknown>) =>
    api.post('/api/books', data),

  get: (id: string) =>
    api.get(`/api/books/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/books/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/books/${id}`),

  uploadCover: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('cover', file)
    return api.post(`/api/books/${id}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
