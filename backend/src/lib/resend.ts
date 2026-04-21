import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY || 're_placeholder'

export const resend = apiKey !== 're_placeholder'
  ? new Resend(apiKey)
  : null

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resend) return
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Bem-vindo ao Planner Literário 📚',
      html: `<h1>Olá, ${name}!</h1><p>Bem-vindo ao Planner Literário. Acesse: ${process.env.FRONTEND_URL}</p>`
    })
  } catch (err) {
    console.error('Erro ao enviar email de boas-vindas:', err)
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  if (!resend) return
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Redefinição de senha — Planner Literário',
      html: `<p>Clique no link para redefinir sua senha (expira em 1 hora):</p><a href="${resetLink}">${resetLink}</a>`
    })
  } catch (err) {
    console.error('Erro ao enviar email de reset:', err)
  }
}
