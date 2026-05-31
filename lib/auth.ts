import jwt from 'jsonwebtoken'
import { env } from './env'

export function createMagicLink(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const token = jwt.sign({ email, code }, env.MAGIC_LINK_SECRET, { expiresIn: '15m' })

  return {
    code,
    token,
  }
}
