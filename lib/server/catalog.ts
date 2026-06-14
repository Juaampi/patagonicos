'use server'

import { ProductStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { deleteProductImage, uploadProductImage } from '@/lib/cloudinary'
import { products as fallbackProducts } from '@/lib/store-data'
import type { Product } from '@/types/store'
import { slugify } from '@/lib/utils'
import { OUT_OF_STOCK_PLACEHOLDER_SIZE } from '@/lib/variant-utils'

const defaultCategories = [
  {
    name: 'Capas',
    slug: 'capas',
    description: 'Capas técnicas para viento, nieve y humedad.',
  },
  {
    name: 'Camperas',
    slug: 'camperas',
    description: 'Camperas térmicas de silueta sobria para ciudad y montaña.',
  },
  {
    name: 'Parkas',
    slug: 'parkas',
    description: 'Parkas premium con cobertura dorsal y perfil outdoor.',
  },
  {
    name: 'Buzos',
    slug: 'buzos',
    description: 'Buzos térmicos livianos para abrigo diario.',
  },
  {
    name: 'Chalecos',
    slug: 'chalecos',
    description: 'Chalecos livianos para sumar abrigo sin limitar el movimiento.',
  },
  {
    name: 'Botas',
    slug: 'botas',
    description: 'Protección para patas en nieve, agua y terreno frío.',
  },
  {
    name: 'Mantas',
    slug: 'mantas',
    description: 'Mantas de descanso y abrigo indoor premium.',
  },
  {
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Accesorios funcionales para completar la protección.',
  },
]

export async function ensureBaseCategories() {
  await prisma.$connect()

  for (const category of defaultCategories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: category.slug },
    })

    if (existingCategory) {
      await prisma.category.update({
        where: { id: existingCategory.id },
        data: {
          name: category.name,
          description: category.description,
        },
      })
      continue
    }

    await prisma.category.create({
      data: category,
    })
  }

  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseMultiline(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function mapDbProduct(
  product: Prisma.ProductGetPayload<{
    include: {
      category: true
      images: true
      variants: true
      reviews: true
      orderItems: {
        include: {
          order: true
        }
      }
    }
  }>,
): Product {
  const colorMap = new Map<string, { name: string; hex: string }>()
  for (const variant of product.variants) {
    if (!colorMap.has(variant.colorName)) {
      colorMap.set(variant.colorName, {
        name: variant.colorName,
        hex: variant.colorHex,
      })
    }
  }

  const sizeMap = new Map<string, { label: string; chest: string; length: string }>()
  for (const variant of product.variants) {
    if (variant.size === OUT_OF_STOCK_PLACEHOLDER_SIZE) {
      continue
    }
    sizeMap.set(variant.size, {
      label: variant.size,
      chest: '-',
      length: '-',
    })
  }

  const paidSalesCount =
    product.baseSalesCount +
    product.orderItems.reduce((total, item) => {
      return item.order.paymentStatus === 'PAID' ? total + item.quantity : total
    }, 0)

  return {
    id: product.id,
    slug: slugify(product.slug || product.name),
    name: product.name,
    animalType: product.animalType,
    salesCount: paidSalesCount,
    category: product.category.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    mainImageUrl: product.mainImageUrl ?? undefined,
    videoUrl: product.videoUrl ?? undefined,
    shortDescription: product.shortDescription,
    description: product.description,
    useTags: product.useTags,
    featureTags: product.featureTags,
    materials: product.materials,
    careInstructions: product.careInstructions,
    colors: Array.from(colorMap.values()),
    sizes: Array.from(sizeMap.values()),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      stock: variant.stock,
      sku: variant.sku,
    })),
    images: product.images.map((image) => ({
      id: image.id,
      type: image.type,
      colorName: image.colorName ?? undefined,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder || image.position,
    })),
    reviews: product.reviews
      .filter((review) => review.approved)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((review) => ({
        id: review.id,
        authorName: review.authorName,
        authorLocation: review.authorLocation ?? undefined,
        rating: review.rating,
        title: review.title ?? undefined,
        comment: review.comment,
        imageUrl: review.imageUrl ?? undefined,
        imageAlt: review.imageAlt ?? undefined,
        createdAt: review.createdAt.toISOString(),
      })),
  }
}

export async function getCatalogProducts() {
  try {
    await prisma.$connect()

    const items = await prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        category: true,
        images: {
          orderBy: [{ sortOrder: 'asc' }, { position: 'asc' }],
        },
        variants: {
          orderBy: [{ colorName: 'asc' }, { size: 'asc' }],
        },
        reviews: true,
        orderItems: {
          include: {
            order: true,
          },
        },
      },
      orderBy: [{ productStar: 'desc' }, { featured: 'desc' }, { createdAt: 'desc' }],
    })

    if (items.length === 0) {
      return fallbackProducts
    }

    return items.map(mapDbProduct)
  } catch {
    return fallbackProducts
  }
}

export async function getCatalogProductBySlug(slug: string) {
  const items = await getCatalogProducts()
  const normalizedSlug = slugify(decodeURIComponent(slug))
  return items.find((item) => slugify(item.slug) === normalizedSlug)
}

export async function getRelatedCatalogProducts(slug: string) {
  const items = await getCatalogProducts()
  const normalizedSlug = slugify(decodeURIComponent(slug))
  return items.filter((item) => slugify(item.slug) !== normalizedSlug).slice(0, 3)
}

export async function getFeaturedCatalogProducts() {
  const items = await getCatalogProducts()
  return items.slice(0, 3)
}

export async function getStarCatalogProduct() {
  const items = await getCatalogProducts()
  return items[0]
}

export async function getAdminSnapshot() {
  const categories = await ensureBaseCategories()
  const [products, orders, customers, reviews] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        variants: true,
        images: {
          orderBy: [{ sortOrder: 'asc' }, { position: 'asc' }],
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.customer.findMany({
      include: {
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.productReview.findMany({
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { categories, products, orders, customers, reviews }
}

export async function saveProductAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message: string },
  formData: FormData,
) {
  const startedAt = Date.now()
  const uploadedPublicIdsForCleanup: string[] = []
  try {
    const productId = String(formData.get('productId') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()
    const rawSlug = String(formData.get('slug') ?? '').trim()
    const animalType = String(formData.get('animalType') ?? 'DOG').trim()
    const shortDescription = String(formData.get('shortDescription') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const videoUrlValue = String(formData.get('videoUrl') ?? '').trim()
    const categoryId = String(formData.get('categoryId') ?? '').trim()
    const price = Number(formData.get('price') ?? 0)
    const baseSalesCount = Number(formData.get('baseSalesCount') ?? 0)
    const compareAtPriceValue = String(formData.get('compareAtPrice') ?? '').trim()
    const statusValue = String(formData.get('status') ?? 'ACTIVE').trim()
    const useTags = parseCsv(String(formData.get('useTags') ?? ''))
    const featureTags = parseCsv(String(formData.get('featureTags') ?? ''))
    const materials = parseMultiline(String(formData.get('materials') ?? ''))
    const careInstructions = parseMultiline(String(formData.get('careInstructions') ?? ''))
    const variantsRaw = parseMultiline(String(formData.get('variants') ?? ''))
    const rawImageColorAssignments = formData
      .getAll('imageColorAssignments')
      .map((value) => String(value).trim())
    const legacyImageColors = parseMultiline(String(formData.get('imageColors') ?? ''))
    const replaceImages = Boolean(formData.get('replaceImages'))
    const mainImageEntry = formData.get('mainImage')
    const mainImageFile = mainImageEntry instanceof File && mainImageEntry.size > 0 ? mainImageEntry : null
    const uploadedMainImageUrl = String(formData.get('uploadedMainImageUrl') ?? '').trim()
    const uploadedMainImagePublicId = String(formData.get('uploadedMainImagePublicId') ?? '').trim()
    const infoImageTypes = formData
      .getAll('infoImageTypes')
      .map((value) => String(value).trim())
    const infoImageSortOrders = formData
      .getAll('infoImageSortOrders')
      .map((value) => Number(String(value).trim() || '0'))
    const rawInfoImages = formData.getAll('infoImages')
    const deleteImageIds = formData
      .getAll('deleteImageIds')
      .map((value) => String(value).trim())
      .filter(Boolean)
    const imageEntries = formData.getAll('images').map((entry, index) => ({
      file: entry instanceof File ? entry : null,
      colorName: rawImageColorAssignments[index] || legacyImageColors[index] || '',
    }))
    const uploadedVariantImageUrls = formData
      .getAll('uploadedVariantImageUrls')
      .map((value) => String(value).trim())
    const uploadedVariantImagePublicIds = formData
      .getAll('uploadedVariantImagePublicIds')
      .map((value) => String(value).trim())
    const clientUploadedImages = uploadedVariantImageUrls
      .map((url, index) => ({
        url,
        publicId: uploadedVariantImagePublicIds[index] || '',
        colorName: rawImageColorAssignments[index] || legacyImageColors[index] || '',
      }))
      .filter((entry) => entry.url)
    const uploadedImages = imageEntries.filter(
      (entry): entry is { file: File; colorName: string } => entry.file instanceof File && entry.file.size > 0,
    )
    const uploadedInfoImageUrls = formData
      .getAll('uploadedInfoImageUrls')
      .map((value) => String(value).trim())
    const uploadedInfoImagePublicIds = formData
      .getAll('uploadedInfoImagePublicIds')
      .map((value) => String(value).trim())
    const uploadedInfoImages = rawInfoImages
      .map((entry, index) => ({
        file: entry instanceof File ? entry : null,
        type: infoImageTypes[index] === 'LIFESTYLE' ? 'LIFESTYLE' : 'INFO',
        sortOrder: Number.isFinite(infoImageSortOrders[index]) ? infoImageSortOrders[index] : 0,
      }))
      .filter((entry): entry is { file: File; type: 'INFO' | 'LIFESTYLE'; sortOrder: number } => entry.file instanceof File && entry.file.size > 0)
    const clientUploadedInfoImages = uploadedInfoImageUrls
      .map((url, index) => ({
        url,
        publicId: uploadedInfoImagePublicIds[index] || '',
        type: infoImageTypes[index] === 'LIFESTYLE' ? 'LIFESTYLE' as const : 'INFO' as const,
        sortOrder: Number.isFinite(infoImageSortOrders[index]) ? infoImageSortOrders[index] : 0,
      }))
      .filter((entry) => entry.url)

    if (uploadedMainImagePublicId) {
      uploadedPublicIdsForCleanup.push(uploadedMainImagePublicId)
    }
    uploadedPublicIdsForCleanup.push(
      ...clientUploadedImages.map((entry) => entry.publicId).filter(Boolean),
      ...clientUploadedInfoImages.map((entry) => entry.publicId).filter(Boolean),
    )

    const slug = slugify(rawSlug || name)

    if (!name || !slug || !shortDescription || !description || !categoryId || !price) {
      return {
        status: 'error' as const,
        message: 'Completá nombre, slug, descripción, precio y categoría.',
        redirectTo: undefined,
      }
    }

    if (variantsRaw.length === 0) {
      return {
        status: 'error' as const,
        message: 'Agregá al menos una variante con color y talles válidos.',
        redirectTo: undefined,
      }
    }

    const existingProduct = productId
      ? await prisma.product.findUnique({
          where: { id: productId },
          include: {
            images: {
              orderBy: { position: 'asc' },
            },
          },
        })
      : null

    if (productId && !existingProduct) {
      return {
        status: 'error' as const,
        message: 'No encontramos el producto que querés editar.',
        redirectTo: undefined,
      }
    }

    if (
      !existingProduct &&
      !mainImageFile &&
      !uploadedMainImageUrl &&
      uploadedImages.length === 0 &&
      clientUploadedImages.length === 0 &&
      uploadedInfoImages.length === 0 &&
      clientUploadedInfoImages.length === 0
    ) {
      return {
        status: 'error' as const,
        message: 'Subí una imagen principal, una imagen de variante o al menos una imagen informativa.',
        redirectTo: undefined,
      }
    }

    const variants = variantsRaw.map((line, index) => {
      const [colorName, colorHex, size, stockValue, skuValue] = line.split('|').map((item) => item.trim())
      if (!colorName || !colorHex || !size) {
        throw new Error(`La variante ${index + 1} no tiene el formato correcto.`)
      }

      return {
        colorName,
        colorHex,
        size,
        stock: Number(stockValue || 0),
        sku:
          skuValue ||
          `${slug}-${colorName}-${size === OUT_OF_STOCK_PLACEHOLDER_SIZE ? 'sin-stock' : size}`
            .toLowerCase()
            .replace(/\s+/g, '-'),
      }
    })

    const existingPositionByColor = new Map<string, number>()
    if (existingProduct && !replaceImages) {
      for (const image of existingProduct.images) {
        if (deleteImageIds.includes(image.id) || !image.colorName || image.type !== 'COLOR') {
          continue
        }
        const currentCount = existingPositionByColor.get(image.colorName) ?? 0
        existingPositionByColor.set(image.colorName, currentCount + 1)
      }
    }

    const newImageCounts = new Map<string, number>()
    console.info('[saveProductAction] starting uploads', {
      mode: existingProduct ? 'edit' : 'create',
      productId: existingProduct?.id ?? null,
      mainImage: Boolean(mainImageFile),
      variantImageCount: uploadedImages.length,
      infoImageCount: uploadedInfoImages.length,
    })
    const uploadStartedAt = Date.now()
    const [mainImageUpload, imageUploads, infoImageUploads] = await Promise.all([
      uploadedMainImageUrl
        ? Promise.resolve({
            secure_url: uploadedMainImageUrl,
            public_id: uploadedMainImagePublicId || null,
          })
        : mainImageFile
        ? (async () =>
            uploadProductImage(
              `data:${mainImageFile.type};base64,${Buffer.from(await mainImageFile.arrayBuffer()).toString('base64')}`,
            ))()
        : Promise.resolve(null),
      Promise.all([
        ...clientUploadedImages.map(async (entry) => {
          const imageColorName = entry.colorName || variants[0].colorName
          const existingCount = replaceImages ? 0 : (existingPositionByColor.get(imageColorName) ?? 0)
          const newCount = newImageCounts.get(imageColorName) ?? 0
          newImageCounts.set(imageColorName, newCount + 1)

          return {
            type: 'COLOR' as const,
            colorName: imageColorName,
            url: entry.url,
            cloudinaryId: entry.publicId || null,
            alt: `${name} ${imageColorName}`,
            position: existingCount + newCount,
            sortOrder: existingCount + newCount,
          }
        }),
        ...uploadedImages.map(async (entry) => {
          const imageColorName = entry.colorName || variants[0].colorName
          const existingCount = replaceImages ? 0 : (existingPositionByColor.get(imageColorName) ?? 0)
          const newCount = newImageCounts.get(imageColorName) ?? 0
          const tempPath = `data:${entry.file.type};base64,${Buffer.from(await entry.file.arrayBuffer()).toString('base64')}`
          const uploaded = await uploadProductImage(tempPath)
          newImageCounts.set(imageColorName, newCount + 1)

          return {
            type: 'COLOR' as const,
            colorName: imageColorName,
            url: uploaded.secure_url,
            cloudinaryId: uploaded.public_id,
            alt: `${name} ${imageColorName}`,
            position: existingCount + newCount,
            sortOrder: existingCount + newCount,
          }
        }),
      ]),
      Promise.all([
        ...clientUploadedInfoImages.map(async (entry, index) => ({
          type: entry.type,
          colorName: null,
          url: entry.url,
          cloudinaryId: entry.publicId || null,
          alt: `${name} ${entry.type === 'LIFESTYLE' ? 'Lifestyle' : 'Info'} ${index + 1}`,
          position: entry.sortOrder,
          sortOrder: entry.sortOrder,
        })),
        ...uploadedInfoImages.map(async (entry, index) => {
          const tempPath = `data:${entry.file.type};base64,${Buffer.from(await entry.file.arrayBuffer()).toString('base64')}`
          const uploaded = await uploadProductImage(tempPath)

          return {
            type: entry.type,
            colorName: null,
            url: uploaded.secure_url,
            cloudinaryId: uploaded.public_id,
            alt: `${name} ${entry.type === 'LIFESTYLE' ? 'Lifestyle' : 'Info'} ${index + 1}`,
            position: entry.sortOrder,
            sortOrder: entry.sortOrder,
          }
        }),
      ]),
    ])
    console.info('[saveProductAction] uploads completed', {
      durationMs: Date.now() - uploadStartedAt,
      totalDurationMs: Date.now() - startedAt,
      mainUploaded: Boolean(mainImageUpload),
      variantUploaded: imageUploads.length,
      infoUploaded: infoImageUploads.length,
    })
    const fallbackMainImageUrl = mainImageUpload?.secure_url ?? imageUploads[0]?.url ?? infoImageUploads[0]?.url ?? null

    if (existingProduct && deleteImageIds.length > 0) {
      const imagesToDelete = existingProduct.images.filter((image) => deleteImageIds.includes(image.id))
      await Promise.all(imagesToDelete.map((image) => (image.cloudinaryId ? deleteProductImage(image.cloudinaryId) : Promise.resolve())))
    }

    if (existingProduct) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          slug,
          animalType: animalType === 'CAT' ? 'CAT' : 'DOG',
          ...(mainImageUpload ? { mainImageUrl: mainImageUpload.secure_url } : {}),
          videoUrl: videoUrlValue || null,
          shortDescription,
          description,
          price,
          baseSalesCount: Number.isFinite(baseSalesCount) && baseSalesCount >= 0 ? baseSalesCount : 0,
          compareAtPrice: compareAtPriceValue ? Number(compareAtPriceValue) : null,
          categoryId,
          status: statusValue === 'INACTIVE' ? ProductStatus.INACTIVE : ProductStatus.ACTIVE,
          featured: Boolean(formData.get('featured')),
          productStar: Boolean(formData.get('productStar')),
          useTags,
          featureTags,
          materials,
          careInstructions,
          variants: {
            deleteMany: {},
            create: variants,
          },
          images: {
            ...(replaceImages
              ? { deleteMany: {} }
              : deleteImageIds.length > 0
                ? { deleteMany: { id: { in: deleteImageIds } } }
                : {}),
            ...((imageUploads.length > 0 || infoImageUploads.length > 0)
              ? { create: [...imageUploads, ...infoImageUploads] }
              : {}),
          },
        },
      })
    } else {
      await prisma.product.create({
        data: {
          name,
          slug,
          animalType: animalType === 'CAT' ? 'CAT' : 'DOG',
          mainImageUrl: fallbackMainImageUrl,
          videoUrl: videoUrlValue || null,
          shortDescription,
          description,
          price,
          baseSalesCount: Number.isFinite(baseSalesCount) && baseSalesCount >= 0 ? baseSalesCount : 0,
          compareAtPrice: compareAtPriceValue ? Number(compareAtPriceValue) : null,
          categoryId,
          status: statusValue === 'INACTIVE' ? ProductStatus.INACTIVE : ProductStatus.ACTIVE,
          featured: Boolean(formData.get('featured')),
          productStar: Boolean(formData.get('productStar')),
          useTags,
          featureTags,
          materials,
          careInstructions,
          variants: {
            create: variants,
          },
          images: {
            create: [...imageUploads, ...infoImageUploads],
          },
        },
      })
    }

    uploadedPublicIdsForCleanup.length = 0

    revalidatePath('/admin')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/productos')
    revalidatePath('/productos')
    revalidatePath('/')

    return {
      status: 'success' as const,
      message: existingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
      redirectTo: existingProduct ? '/admin/productos?saved=updated' : '/admin/productos?saved=created',
    }
  } catch (error) {
    if (uploadedPublicIdsForCleanup.length > 0) {
      await Promise.allSettled(
        uploadedPublicIdsForCleanup
          .filter(Boolean)
          .map((publicId) => deleteProductImage(publicId)),
      )
    }

    console.error('[saveProductAction] failed', {
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        status: 'error' as const,
        message: 'Ya existe un producto con ese slug o una variante con ese SKU. Cambialo y volvé a guardar.',
        redirectTo: undefined,
      }
    }

    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'No se pudo guardar el producto.',
      redirectTo: undefined,
    }
  }
}

export async function saveManualReviewAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message: string },
  formData: FormData,
) {
  try {
    const reviewId = String(formData.get('reviewId') ?? '').trim()
    const productId = String(formData.get('productId') ?? '').trim()
    const authorName = String(formData.get('authorName') ?? '').trim()
    const authorLocation = String(formData.get('authorLocation') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const comment = String(formData.get('comment') ?? '').trim()
    const rating = Number(formData.get('rating') ?? 5)
    const createdAtValue = String(formData.get('createdAt') ?? '').trim()
    const imageEntry = formData.get('image')
    const imageFile = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null

    if (!productId || !authorName || !comment || !rating) {
      return {
        status: 'error' as const,
        message: 'Completá producto, autor, puntaje y comentario.',
        redirectTo: undefined,
      }
    }

    let uploadedImage:
      | {
          secure_url: string
          public_id: string
        }
      | null = null

    if (imageFile) {
      uploadedImage = await uploadProductImage(
        `data:${imageFile.type};base64,${Buffer.from(await imageFile.arrayBuffer()).toString('base64')}`,
        'patitas-andinas/reviews',
      )
    }

    if (reviewId) {
      const existingReview = await prisma.productReview.findUnique({
        where: { id: reviewId },
      })

      if (!existingReview) {
        return {
          status: 'error' as const,
          message: 'No encontramos el comentario a editar.',
          redirectTo: undefined,
        }
      }

      if (uploadedImage && existingReview.imageCloudinaryId) {
        await deleteProductImage(existingReview.imageCloudinaryId)
      }

      await prisma.productReview.update({
        where: { id: reviewId },
        data: {
          productId,
          authorName,
          authorLocation: authorLocation || null,
          title: title || null,
          comment,
          rating,
          ...(uploadedImage
            ? {
                imageUrl: uploadedImage.secure_url,
                imageAlt: `${authorName} reseña`,
                imageCloudinaryId: uploadedImage.public_id,
              }
            : {}),
          ...(createdAtValue ? { createdAt: new Date(createdAtValue) } : {}),
        },
      })
    } else {
      await prisma.productReview.create({
        data: {
          productId,
          authorName,
          authorLocation: authorLocation || null,
          title: title || null,
          comment,
          rating,
          imageUrl: uploadedImage?.secure_url ?? null,
          imageAlt: uploadedImage ? `${authorName} reseña` : null,
          imageCloudinaryId: uploadedImage?.public_id ?? null,
          createdAt: createdAtValue ? new Date(createdAtValue) : new Date(),
        },
      })
    }

    revalidatePath('/admin')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/comentarios')
    revalidatePath('/productos')
    revalidatePath('/')

    return {
      status: 'success' as const,
      message: reviewId ? 'Comentario actualizado correctamente.' : 'Comentario creado correctamente.',
      redirectTo: '/admin/comentarios?saved=review',
    }
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'No se pudo guardar el comentario.',
      redirectTo: undefined,
    }
  }
}

export async function deleteProductAction(formData: FormData) {
  const productId = String(formData.get('productId') ?? '')
  if (!productId) {
    throw new Error('Producto inválido.')
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  })

  if (!product) {
    throw new Error('Producto no encontrado.')
  }

  await prisma.product.delete({
    where: { id: productId },
  })

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  revalidatePath('/')
  redirect('/admin/productos?saved=deleted')
}

export const createProductAction = saveProductAction
