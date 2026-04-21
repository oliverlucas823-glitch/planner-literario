import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import { authApi } from '@/api/auth'

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token inválido ou expirado.')
      return
    }
    try {
      await authApi.resetPassword(token, data.password)
      toast.success('Senha redefinida com sucesso!')
      navigate('/login')
    } catch {
      toast.error('Token inválido ou expirado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#FAF7F2]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B3A52] flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-[#2C1810]">Planner Literário</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#2C1810]">Nova senha</h1>
          <p className="text-[#7A6358] mt-1 text-sm">Digite sua nova senha abaixo.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Nova senha</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Confirmar senha</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repita a senha"
              className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
            />
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full py-2.5 bg-[#8B3A52] text-white rounded-lg font-semibold hover:bg-[#6E2D40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>

        <p className="text-center text-sm text-[#7A6358]">
          <Link to="/login" className="text-[#8B3A52] font-semibold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
