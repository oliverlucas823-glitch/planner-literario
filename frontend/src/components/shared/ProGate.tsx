import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
  isPro: boolean
  message?: string
}

export default function ProGate({ children, isPro, message = 'Recurso exclusivo PRO' }: Props) {
  const navigate = useNavigate()

  if (isPro) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F5ECF0] flex items-center justify-center">
            <Lock size={22} className="text-[#8B3A52]" />
          </div>
          <p className="text-sm font-semibold text-[#2C1810]">{message}</p>
          <button
            onClick={() => navigate('/assinatura')}
            className="px-4 py-2 bg-[#8B3A52] text-white rounded-lg text-xs font-medium hover:bg-[#6E2D40] transition-colors"
          >
            Assinar PRO
          </button>
        </div>
      </div>
    </div>
  )
}
