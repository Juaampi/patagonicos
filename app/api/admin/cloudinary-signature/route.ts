import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { cloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: 'Cloudinary credentials are not configured' },
      { status: 500 },
    )
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'patitas-andinas/products'
  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      timestamp,
    },
    env.CLOUDINARY_API_SECRET,
  )

  return NextResponse.json({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    signature,
    timestamp,
  })
}
