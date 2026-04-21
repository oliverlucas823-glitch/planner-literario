import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const QUOTES = [
  { text: 'Um leitor vive mil vidas antes de morrer.', author: 'George R.R. Martin' },
  { text: 'Não existe amigo mais leal do que um livro.', author: 'Ernest Hemingway' },
  { text: 'Ler é sonhar pela mão de outrem.', author: 'Fernando Pessoa' },
  { text: 'Os livros são espelhos: só se vê neles o que já se tem dentro.', author: 'Carlos Ruiz Zafón' },
]

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch {
      toast.error('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: quote panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#2C1810] text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#8B3A52] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold">Planner Literário</span>
        </div>
        <blockquote className="space-y-4">
          <p className="font-display text-3xl font-medium leading-snug text-[#F5ECF0]">
            "{quote.text}"
          </p>
          <footer className="text-[#C9B99A] text-sm">— {quote.author}</footer>
        </blockquote>
        <p className="text-[#7A6358] text-sm">© {new Date().getFullYear()} Planner Literário</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FAF7F2]">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#8B3A52] flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-[#2C1810]">Planner Literário</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#2C1810]">Bem-vindo de volta</h1>
            <p className="text-[#7A6358] mt-1 text-sm">Entre na sua conta para continuar lendo.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2C1810] mb-1.5">E-mail</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#2C1810]">Senha</label>
                <Link to="/esqueci-senha" className="text-xs text-[#8B3A52] hover:underline">
                  Esqueci a senha
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-[#C9B99A] bg-white text-[#2C1810] placeholder:text-[#C9B99A] focus:outline-none focus:ring-2 focus:ring-[#8B3A52] focus:border-transparent text-sm"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#8B3A52] text-white rounded-lg font-semibold hover:bg-[#6E2D40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-[#7A6358]">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="text-[#8B3A52] font-semibold hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
