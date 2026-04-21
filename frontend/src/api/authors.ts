import { api } from '@/lib/axios'

export const authorsApi = {
  list: (params?: { is_national?: boolean }) =>
    api.get('/api/authors', { params }),

  create: (data: Record<string, unknown>) =>
    api.post('/api/authors', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/api/authors/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/authors/${id}`),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/api/authors/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
