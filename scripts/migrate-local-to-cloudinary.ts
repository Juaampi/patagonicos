import path from 'node:path'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'

function isLocalUploadUrl(value: string | null | undefined) {
  return Boolean(value && value.startsWith('/uploads/'))
}

function getAbsolutePathFromUploadUrl(url: string) {
  const relativePath = url.replace(/^\/+/, '').split('/').join(path.sep)
  return path.join(process.cwd(), 'public', relativePath)
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
    if (!isLocalUploadUrl(product.mainImageUrl)) {
      continue
    }

    const uploaded = await uploadProductImage(
      getAbsolutePathFromUploadUrl(product.mainImageUrl!),
      'patitas-andinas/products',
    )

    await prisma.product.update({
      where: { id: product.id },
      data: {
        mainImageUrl: uploaded.secure_url,
      },
    })

    migrated += 1
  }

  return migrated
}

async function migrateProductImages() {
  const images = await prisma.productImage.findMany({
    select: {
      id: true,
      url: true,
    },
  })

  let migrated = 0

  for (const image of images) {
    if (!isLocalUploadUrl(image.url)) {
      continue
    }

    const uploaded = await uploadProductImage(
      getAbsolutePathFromUploadUrl(image.url),
      'patitas-andinas/products',
    )

    await prisma.productImage.update({
      where: { id: image.id },
      data: {
        url: uploaded.secure_url,
        cloudinaryId: uploaded.public_id,
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
    },
  })

  let migrated = 0

  for (const review of reviews) {
    if (!isLocalUploadUrl(review.imageUrl)) {
      continue
    }

    const uploaded = await uploadProductImage(
      getAbsolutePathFromUploadUrl(review.imageUrl!),
      'patitas-andinas/reviews',
    )

    await prisma.productReview.update({
      where: { id: review.id },
      data: {
        imageUrl: uploaded.secure_url,
        imageCloudinaryId: uploaded.public_id,
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
    },
  })

  let migrated = 0

  for (const image of images) {
    if (!isLocalUploadUrl(image.url)) {
      continue
    }

    const uploaded = await uploadProductImage(
      getAbsolutePathFromUploadUrl(image.url),
      'patitas-andinas/adoptions',
    )

    await prisma.adoptionPetImage.update({
      where: { id: image.id },
      data: {
        url: uploaded.secure_url,
        cloudinaryId: uploaded.public_id,
      },
    })

    migrated += 1
  }

  return migrated
}

async function main() {
  console.info('[migrate-local-to-cloudinary] starting migration')

  const [productMainImages, productImages, reviewImages, adoptionImages] = await Promise.all([
    migrateProductMainImages(),
    migrateProductImages(),
    migrateReviewImages(),
    migrateAdoptionImages(),
  ])

  console.info('[migrate-local-to-cloudinary] completed', {
    productMainImages,
    productImages,
    reviewImages,
    adoptionImages,
    total: productMainImages + productImages + reviewImages + adoptionImages,
  })
}

main()
  .catch((error) => {
    console.error('[migrate-local-to-cloudinary] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
