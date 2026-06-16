import { Resend } from 'resend'
import { env } from './env'

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}) {
  if (env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY) {
    const resend = new Resend(env.RESEND_API_KEY)
    return resend.emails.send({
      from: from ?? `Patagonicos Ventas <${env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
  }

  console.info('[email:console]', { to, subject, from: from ?? `Patagonicos Ventas <${env.FROM_EMAIL}>`, replyTo })
  return { ok: true }
}
