import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const LOCAL_UPLOAD_PREFIX = 'local:'
const LOCAL_UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads', 'migrated')

function isCloudinaryUrl(value: string | null | undefined) {
  return Boolean(value && value.includes('res.cloudinary.com'))
}

function getExtensionFromUrl(url: string, contentType: string | null) {
  const pathname = new URL(url).pathname
  const extensionFromPath = path.extname(pathname).replace('.', '').toLowerCase()

  if (extensionFromPath) {
    return extensionFromPath
  }

  const normalizedContentType = (contentType ?? '').toLowerCase()
  if (normalizedContentType === 'image/jpeg') return 'jpg'
  if (normalizedContentType === 'image/png') return 'png'
  if (normalizedContentType === 'image/webp') return 'webp'
  if (normalizedContentType === 'image/gif') return 'gif'
  if (normalizedContentType === 'image/avif') return 'avif'
  if (normalizedContentType === 'image/svg+xml') return 'svg'

  return 'bin'
}

async function downloadToLocal(url: string, folder: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url}. Status ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const extension = getExtensionFromUrl(url, response.headers.get('content-type'))
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`
  const folderPath = path.join(LOCAL_UPLOADS_ROOT, folder)
  const filePath = path.join(folderPath, fileName)

  await mkdir(folderPath, { recursive: true })
  await writeFile(filePath, Buffer.from(arrayBuffer))

  const relativePath = `${folder}/${fileName}`.replace(/\\/g, '/')

  return {
    url: `/uploads/migrated/${relativePath}`,
    localId: `${LOCAL_UPLOAD_PREFIX}migrated/${relativePath}`,
  }
}

async function migrateProductMainImages() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      mainImageUrl: true,
    },
  })

  let migrated = 0

  for (const product of products) {
    if (!isCloudinaryUrl(product.mainImageUrl)) {
      continue
    }

    const localAsset = await downloadToLocal(product.mainImageUrl!, 'products/main')
    await prisma.product.update({
      where: { id: product.id },
      data: {
        mainImageUrl: localAsset.url,
      },
    })
    migrated += 1
  }

  return migrated
}

async function migrateProductGalleryImages() {
  const images = await prisma.productImage.findMany({
    select: {
      id: true,
      url: true,
      cloudinaryId: true,
    },
  })

  let migrated = 0

  for (const image of images) {
    if (!isCloudinaryUrl(image.url)) {
      continue
    }

    const localAsset = await downloadToLocal(image.url, 'products/gallery')
    await prisma.productImage.update({
      where: { id: image.id },
      data: {
        url: localAsset.url,
        cloudinaryId: localAsset.localId,
      },
    })
    migrated += 1
  }

  return migrated
}

async function migrateReviewImages() {
  const reviews = await prisma.productReview.findMany({
    select: {
      id: true,
      imageUrl: true,
      imageCloudinaryId: true,
    },
  })

  let migrated = 0

  for (const review of reviews) {
    if (!isCloudinaryUrl(review.imageUrl)) {
      continue
    }

    const localAsset = await downloadToLocal(review.imageUrl!, 'reviews')
    await prisma.productReview.update({
      where: { id: review.id },
      data: {
        imageUrl: localAsset.url,
        imageCloudinaryId: localAsset.localId,
      },
    })
    migrated += 1
  }

  return migrated
}

async function migrateAdoptionImages() {
  const images = await prisma.adoptionPetImage.findMany({
    select: {
      id: true,
      url: true,
      cloudinaryId: true,
    },
  })

  let migrated = 0

  for (const image of images) {
    if (!isCloudinaryUrl(image.url)) {
      continue
    }

    const localAsset = await downloadToLocal(image.url, 'adoptions')
    await prisma.adoptionPetImage.update({
      where: { id: image.id },
      data: {
        url: localAsset.url,
        cloudinaryId: localAsset.localId,
      },
    })
    migrated += 1
  }

  return migrated
}

async function main() {
  console.info('[migrate-cloudinary-to-local] starting migration')

  const [productMainImages, productGalleryImages, reviewImages, adoptionImages] = await Promise.all([
    migrateProductMainImages(),
    migrateProductGalleryImages(),
    migrateReviewImages(),
    migrateAdoptionImages(),
  ])

  console.info('[migrate-cloudinary-to-local] completed', {
    productMainImages,
    productGalleryImages,
    reviewImages,
    adoptionImages,
    total: productMainImages + productGalleryImages + reviewImages + adoptionImages,
  })
}

main()
  .catch((error) => {
    console.error('[migrate-cloudinary-to-local] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
