import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { User } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: format === 'long' ? 'long' : '2-digit',
    year: 'numeric',
  })
}

export function formatRelativeDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? 's' : ''}`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `há ${months} ${months > 1 ? 'meses' : 'mês'}`
  }
  const years = Math.floor(days / 365)
  return `há ${years} ${years > 1 ? 'anos' : 'ano'}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function getBookStatusLabel(status: string): string {
  const map: Record<string, string> = {
    lendo: 'Lendo',
    lido: 'Lido',
    abandonado: 'Abandonado',
    quero_ler: 'Quero Ler',
  }
  return map[status] ?? status
}

export function getFormatLabel(format: string): string {
  const map: Record<string, string> = {
    fisico: 'Físico',
    ebook: 'eBook',
    audiobook: 'Audiobook',
  }
  return map[format] ?? format
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function isPro(user: User | null): boolean {
  if (!user) return false
  if (user.subscription_status === 'active') return true
  if (user.subscription_status === 'canceled' && user.subscription_expires_at) {
    return new Date(user.subscription_expires_at) > new Date()
  }
  return false
}
