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
    const result = await resend.emails.send({
      from: from ?? `Patagonicos Ventas <${env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })

    if (result.error) {
      throw new Error(
        typeof result.error === 'object' && result.error && 'message' in result.error
          ? String(result.error.message)
          : 'Resend email send failed.',
      )
    }

    return result
  }

  console.info('[email:console]', { to, subject, from: from ?? `Patagonicos Ventas <${env.FROM_EMAIL}>`, replyTo })
  return { ok: true }
}
