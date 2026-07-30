import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadProductImage(filePath: string, folder = 'patitas-andinas/products') {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured')
  }

  return cloudinary.uploader.upload(filePath, {
    folder,
  })
}

export async function deleteProductImage(publicId: string) {
  if (!publicId) {
    return
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not configured')
  }

  await cloudinary.uploader.destroy(publicId)
}
