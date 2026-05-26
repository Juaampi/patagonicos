import { Resend } from 'resend'
import { env } from './env'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY) {
    const resend = new Resend(env.RESEND_API_KEY)
    return resend.emails.send({
      from: env.FROM_EMAIL,
      to,
      subject,
      html,
    })
  }

  console.info('[email:console]', { to, subject })
  return { ok: true }
}
