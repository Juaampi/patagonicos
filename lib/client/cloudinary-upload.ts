export type UploadedCloudinaryAsset = {
  url: string
  publicId: string
  originalName: string
}

type CloudinarySignaturePayload = {
  cloudName: string
  apiKey: string
  folder: string
  signature: string
  timestamp: number
}

async function getProductUploadSignature() {
  const response = await fetch('/api/admin/cloudinary-signature', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('No se pudo preparar la subida de imágenes.')
  }

  return (await response.json()) as CloudinarySignaturePayload
}

export async function uploadProductImageFromBrowser(file: File): Promise<UploadedCloudinaryAsset> {
  const signature = await getProductUploadSignature()
  const body = new FormData()
  body.append('file', file)
  body.append('api_key', signature.apiKey)
  body.append('timestamp', String(signature.timestamp))
  body.append('signature', signature.signature)
  body.append('folder', signature.folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
    method: 'POST',
    body,
  })

  if (!response.ok) {
    throw new Error('Cloudinary rechazó la imagen.')
  }

  const payload = (await response.json()) as {
    secure_url?: string
    public_id?: string
    original_filename?: string
  }

  if (!payload.secure_url || !payload.public_id) {
    throw new Error('Cloudinary no devolvió una URL válida.')
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    originalName: payload.original_filename || file.name,
  }
}
