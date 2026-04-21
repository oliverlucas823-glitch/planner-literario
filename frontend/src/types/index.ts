export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  subscription_status: 'free' | 'active' | 'canceled' | 'past_due'
  subscription_expires_at: string | null
  stripe_subscription_id?: string | null
}

export interface Book {
  id: string
  user_id: string
  title: string
  author: string
  genre: string | null
  pages: number | null
  format: 'fisico' | 'ebook' | 'audiobook' | null
  cover_url: string | null
  status: 'lendo' | 'lido' | 'abandonado' | 'quero_ler'
  progress: number
  start_date: string | null
  end_date: string | null
  rating: number | null
  rating_plot: number | null
  rating_characters: number | null
  rating_ending: number | null
  rating_writing: number | null
  emotions: string[]
  review: string | null
  would_recommend: boolean | null
  is_favorite: boolean
  favorite_quote: string | null
  series_name: string | null
  series_position: number | null
  is_trilogy: boolean
  wishlist: boolean
  abandonment_reason: string | null
  created_at: string
  updated_at: string
  reading_days?: { id: string; read_date: string }[]
}

export interface ReadingDay {
  id: string
  user_id: string
  book_id: string
  read_date: string
  book?: { title: string; author: string; cover_url: string | null }
}

export interface Challenge {
  id: string
  user_id: string
  type: string
  name: string
  goal: number | null
  year: number
  is_active: boolean
  created_at: string
  items: ChallengeItem[]
  completed_count?: number
}

export interface ChallengeItem {
  id: string
  challenge_id: string
  book_id: string | null
  slot_label: string | null
  position: number
  completed: boolean
  book?: { id: string; title: string; author: string; cover_url: string | null } | null
}

export interface FavoriteAuthor {
  id: string
  user_id: string
  name: string
  nationality: string | null
  photo_url: string | null
  notes: string | null
  is_national: boolean
  created_at: string
}

export interface VisionBoardItem {
  id: string
  user_id: string
  type: 'quote' | 'book_goal' | 'author' | 'image_url' | 'text'
  content: string | null
  position_x: number
  position_y: number
  width: number
  height: number
  bg_color: string
  created_at: string
}

export interface Streak {
  current_streak: number
  max_streak: number
  total_days_read: number
}

export interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}
