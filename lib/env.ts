import { z } from 'zod'

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined
    }

    return value
  }, schema)

const envSchema = z.object({
  DATABASE_URL: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_GOOGLE_TAG_ID: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_META_PIXEL_ID: emptyToUndefined(z.string().optional()),
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(z.string().url().default('http://localhost:3000')),
  SITE_URL: emptyToUndefined(z.string().url().default('http://localhost:3000')),
  JWT_SECRET: emptyToUndefined(z.string().default('change-me')),
  MAGIC_LINK_SECRET: emptyToUndefined(z.string().default('change-me-too')),
  ADMIN_EMAIL: emptyToUndefined(z.string().email().default('juanp.garcia1993@gmail.com')),
  ADMIN_PASS: emptyToUndefined(z.string().default('change-admin-password')),
  CLOUDINARY_CLOUD_NAME: emptyToUndefined(z.string().optional()),
  CLOUDINARY_API_KEY: emptyToUndefined(z.string().optional()),
  CLOUDINARY_API_SECRET: emptyToUndefined(z.string().optional()),
  MERCADOPAGO_ACCESS_TOKEN: emptyToUndefined(z.string().optional()),
  MERCADOPAGO_PUBLIC_KEY: emptyToUndefined(z.string().optional()),
  MERCADOPAGO_WEBHOOK_SECRET: emptyToUndefined(z.string().optional()),
  EMAIL_PROVIDER: emptyToUndefined(z.string().default('console')),
  RESEND_API_KEY: emptyToUndefined(z.string().optional()),
  FROM_EMAIL: emptyToUndefined(z.string().email().default('no-reply@patitasandinas.com')),
  INTERNAL_ACCESS_CODE: emptyToUndefined(z.string().default('patitas-andinas-interno')),
})

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_GOOGLE_TAG_ID: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SITE_URL: process.env.SITE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  MAGIC_LINK_SECRET: process.env.MAGIC_LINK_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASS: process.env.ADMIN_PASS,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL,
  INTERNAL_ACCESS_CODE: process.env.INTERNAL_ACCESS_CODE,
})
