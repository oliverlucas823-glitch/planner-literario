import { api } from '@/lib/axios'

export const readingDaysApi = {
  list: (params?: { year?: number; month?: number; book_id?: string }) =>
    api.get('/api/reading-days', { params }),

  create: (book_id: string, read_date: string) =>
    api.post('/api/reading-days', { book_id, read_date }),

  delete: (id: string) =>
    api.delete(`/api/reading-days/${id}`),

  getStreak: () =>
    api.get('/api/reading-days/streak'),
}
