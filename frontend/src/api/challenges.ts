import { api } from '@/lib/axios'

export const challengesApi = {
  list: () =>
    api.get('/api/challenges'),

  create: (data: Record<string, unknown>) =>
    api.post('/api/challenges', data),

  get: (id: string) =>
    api.get(`/api/challenges/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/challenges/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/challenges/${id}`),

  assignBook: (challengeId: string, itemId: string, data: { book_id: string | null; completed?: boolean }) =>
    api.put(`/api/challenges/${challengeId}/items/${itemId}`, data),
}
