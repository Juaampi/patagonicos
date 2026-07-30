import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from './env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

const LOCAL_UPLOAD_PREFIX = 'local:'
const LOCAL_UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

function getFileExtensionFromMimeType(mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase()

  if (normalizedMimeType === 'image/jpeg') return 'jpg'
  if (normalizedMimeType === 'image/png') return 'png'
  if (normalizedMimeType === 'image/webp') return 'webp'
  if (normalizedMimeType === 'image/gif') return 'gif'
  if (normalizedMimeType === 'image/avif') return 'avif'
  if (normalizedMimeType === 'image/svg+xml') return 'svg'

  return 'bin'
}

async function saveDataUriLocally(dataUri: string, folder: string) {
  const matches = dataUri.match(/^data:(.+?);base64,(.+)$/)
  if (!matches) {
    throw new Error('La imagen local no tiene un formato válido para guardarse.')
  }

  const [, mimeType, base64Payload] = matches
  const extension = getFileExtensionFromMimeType(mimeType)
  const folderSegments = folder.split('/').filter(Boolean)
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`
  const absoluteFolderPath = path.join(LOCAL_UPLOADS_ROOT, ...folderSegments)
  const absoluteFilePath = path.join(absoluteFolderPath, fileName)

  await mkdir(absoluteFolderPath, { recursive: true })
  await writeFile(absoluteFilePath, Buffer.from(base64Payload, 'base64'))

  const relativePath = [...folderSegments, fileName].join('/').replace(/\\/g, '/')

  return {
    secure_url: `/uploads/${relativePath}`,
    public_id: `${LOCAL_UPLOAD_PREFIX}${relativePath}`,
  }
}

export async function uploadProductImage(filePath: string, folder = 'patitas-andinas/products') {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return saveDataUriLocally(filePath, folder)
  }

  return cloudinary.uploader.upload(filePath, {
    folder,
  })
}

export async function deleteProductImage(publicId: string) {
  if (!publicId) {
    return
  }

  if (publicId.startsWith(LOCAL_UPLOAD_PREFIX)) {
    const relativePath = publicId.slice(LOCAL_UPLOAD_PREFIX.length)
    const absoluteFilePath = path.join(LOCAL_UPLOADS_ROOT, ...relativePath.split('/'))

    try {
      await unlink(absoluteFilePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    return
  }

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return
  }

  await cloudinary.uploader.destroy(publicId)
}
