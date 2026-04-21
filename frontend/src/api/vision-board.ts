import { api } from '@/lib/axios'

export const visionBoardApi = {
  list: () =>
    api.get('/api/vision-board'),

  create: (data: Record<string, unknown>) =>
    api.post('/api/vision-board', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/vision-board/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/vision-board/${id}`),
}
