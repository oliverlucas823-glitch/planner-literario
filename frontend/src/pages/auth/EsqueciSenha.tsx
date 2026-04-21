import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BookOpen, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/auth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function EsqueciSenha() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Erro ao enviar e-mail. Tente novamente.')
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

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-green-600 mx-auto" />
            <h2 className="text-xl font-bold text-[#2C1810]">E-mail enviado!</h2>
            <p className="text-sm text-[#7A6358]">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            <Link to="/login" className="text-[#8B3A52] text-sm font-semibold hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-[#2C1810]">Esqueci a senha</h1>
              <p className="text-[#7A6358] mt-1 text-sm">
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#8B3A52] text-white rounded-lg font-semibold hover:bg-[#6E2D40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>

            <p className="text-center text-sm text-[#7A6358]">
              <Link to="/login" className="text-[#8B3A52] font-semibold hover:underline">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
