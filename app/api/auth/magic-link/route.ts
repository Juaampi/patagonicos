import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createMagicLink } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { token, code } = createMagicLink(parsed.data.email)

  await sendEmail({
    to: parsed.data.email,
    subject: 'Acceso a Patagónicos',
    html: `<p>Tu código de acceso es <strong>${code}</strong>.</p><p>Token: ${token}</p>`,
  })

  return NextResponse.json({
    ok: true,
    token,
    codePreview: code,
  })
}
