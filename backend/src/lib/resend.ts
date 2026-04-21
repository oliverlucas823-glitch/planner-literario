import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    await resend.emails.send({
      from: 'Planner Literário <noreply@plannerliterario.com.br>',
      to: email,
      subject: 'Bem-vindo ao Planner Literário 📚',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2C1810;">
          <h1 style="color: #8B3A52;">Olá, ${name}! 📚</h1>
          <p>Seja bem-vindo(a) ao <strong>Planner Literário</strong>, seu espaço para organizar, acompanhar e celebrar cada leitura.</p>
          <p>Aqui você pode:</p>
          <ul>
            <li>Registrar e avaliar seus livros</li>
            <li>Acompanhar seu progresso de leitura</li>
            <li>Criar desafios literários personalizados</li>
            <li>Montar seu vision board de leituras</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#8B3A52;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Acessar meu planner
          </a>
          <p style="margin-top:32px;color:#7A6358;font-size:14px;">Boas leituras! 🌿</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[resend] Falha ao enviar e-mail de boas-vindas:', err)
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  await resend.emails.send({
    from: 'Planner Literário <noreply@plannerliterario.com.br>',
    to: email,
    subject: 'Redefinição de senha — Planner Literário',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2C1810;">
        <h1 style="color: #8B3A52;">Redefinir senha</h1>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#8B3A52;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Redefinir minha senha
        </a>
        <p style="margin-top:24px;color:#7A6358;font-size:14px;">
          ⚠️ Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail.
        </p>
      </div>
    `,
  })
}
