import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function Cadastro() {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data.email, data.password, data.name)
      toast.success('Conta criada com sucesso!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.'
      toast.error(msg)
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
          <h1 className="text-2xl font-bold text-[#2C1810]">Criar conta</h1>
          <p className="text-[#7A6358] mt-1 text-sm">Comece a organizar sua vida literária.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Nome</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Seu nome"
              className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C1810] mb-1.5">E-mail</label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2C1810] mb-1.5">Senha</label>
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
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#8B3A52] text-white rounded-lg font-semibold hover:bg-[#6E2D40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-[#7A6358]">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-[#8B3A52] font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
