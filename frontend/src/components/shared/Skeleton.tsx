import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

export function Skeleton({ className }: Props) {
  return <div className={cn('animate-pulse rounded-lg bg-[#E8DDD0]', className)} />
}
