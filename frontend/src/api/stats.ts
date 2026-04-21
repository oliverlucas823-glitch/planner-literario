import { api } from '@/lib/axios'

export const statsApi = {
  getOverview: () =>
    api.get('/api/stats/overview'),

  getByMonth: (year?: number) =>
    api.get('/api/stats/by-month', { params: year ? { year } : undefined }),

  getByGenre: () =>
    api.get('/api/stats/by-genre'),

  getByFormat: () =>
    api.get('/api/stats/by-format'),

  getPagesEvolution: (year?: number) =>
    api.get('/api/stats/pages-evolution', { params: year ? { year } : undefined }),

  getRatingsByGenre: () =>
    api.get('/api/stats/ratings-by-genre'),

  getWorstBooks: () =>
    api.get('/api/stats/worst-books'),
}
