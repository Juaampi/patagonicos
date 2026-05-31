'use server'

import { AdoptionStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { deleteProductImage, uploadProductImage } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import type { AdoptionPet } from '@/types/store'

const samplePets = [
  {
    name: 'Luna',
    ageLabel: '2 años',
    city: 'San Carlos de Bariloche',
    province: 'Río Negro',
    contactPhone: '294 458 1122',
    status: AdoptionStatus.EN_ADOPCION,
    summary: 'Súper compañera, tranquila en casa y muy cariñosa con personas.',
    images: [
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=1400&q=80',
    ],
  },
  {
    name: 'Toby',
    ageLabel: '1 año',
    city: 'Dina Huapi',
    province: 'Río Negro',
    contactPhone: '294 465 2098',
    status: AdoptionStatus.EN_TRANSITO,
    summary: 'Juguetón, sociable y con mucha energía. Ideal para familia activa.',
    images: [
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&w=1400&q=80',
    ],
  },
  {
    name: 'Mora',
    ageLabel: '4 años',
    city: 'Villa La Angostura',
    province: 'Neuquén',
    contactPhone: '294 433 7610',
    status: AdoptionStatus.EN_ADOPCION,
    summary: 'Muy dulce, obediente y lista para una familia definitiva.',
    images: [
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1518715308788-3005759c95e8?auto=format&fit=crop&w=1400&q=80',
    ],
  },
] as const

function mapAdoptionPet(
  pet: Prisma.AdoptionPetGetPayload<{
    include: {
      images: {
        orderBy: {
          sortOrder: 'asc'
        }
      }
    }
  }>,
): AdoptionPet {
  return {
    id: pet.id,
    name: pet.name,
    ageLabel: pet.ageLabel,
    city: pet.city,
    province: pet.province,
    contactPhone: pet.contactPhone ?? undefined,
    status: pet.status,
    summary: pet.summary ?? undefined,
    images: pet.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  }
}

async function uploadAdoptionImage(source: string) {
  try {
    const uploaded = await uploadProductImage(source, 'patitas-andinas/adoptions')
    return {
      url: uploaded.secure_url,
      cloudinaryId: uploaded.public_id,
    }
  } catch {
    return {
      url: source,
      cloudinaryId: null,
    }
  }
}

export async function ensureAdoptionPetsSeeded() {
  const total = await prisma.adoptionPet.count()

  if (total > 0) {
    await Promise.all(
      samplePets.map((pet) =>
        prisma.adoptionPet.updateMany({
          where: {
            name: pet.name,
            contactPhone: null,
          },
          data: {
            contactPhone: pet.contactPhone,
          },
        }),
      ),
    )
    return
  }

  for (const pet of samplePets) {
    const uploadedImages = await Promise.all(
      pet.images.map(async (imageUrl, index) => {
        const uploaded = await uploadAdoptionImage(imageUrl)

        return {
          url: uploaded.url,
          cloudinaryId: uploaded.cloudinaryId,
          alt: `${pet.name} ${index + 1}`,
          sortOrder: index,
        }
      }),
    )

    await prisma.adoptionPet.create({
      data: {
        name: pet.name,
        ageLabel: pet.ageLabel,
        city: pet.city,
        province: pet.province,
        contactPhone: pet.contactPhone,
        status: pet.status,
        summary: pet.summary,
        images: {
          create: uploadedImages,
        },
      },
    })
  }
}

export async function getAdoptionPets() {
  await ensureAdoptionPetsSeeded()

  const pets = await prisma.adoptionPet.findMany({
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return pets.map(mapAdoptionPet)
}

export async function getPublicAdoptionPets() {
  const pets = await getAdoptionPets()
  return pets.filter((pet) => pet.status === 'EN_ADOPCION')
}

export async function getAdoptionPetById(id: string) {
  await ensureAdoptionPetsSeeded()

  const pet = await prisma.adoptionPet.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return pet ? mapAdoptionPet(pet) : null
}

export async function saveAdoptionPetAction(
  _previousState: { status: 'idle' | 'success' | 'error'; message: string },
  formData: FormData,
) {
  try {
    const petId = String(formData.get('petId') ?? '').trim()
    const name = String(formData.get('name') ?? '').trim()
    const ageLabel = String(formData.get('ageLabel') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const province = String(formData.get('province') ?? '').trim()
    const summary = String(formData.get('summary') ?? '').trim()
    const contactPhone = String(formData.get('contactPhone') ?? '').trim()
    const statusValue = String(formData.get('status') ?? AdoptionStatus.EN_ADOPCION).trim()
    const deleteImageIds = formData.getAll('deleteImageIds').map((value) => String(value).trim()).filter(Boolean)
    const imageFiles = formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (!name || !ageLabel || !city || !province) {
      return {
        status: 'error' as const,
        message: 'Completá nombre, edad, ciudad y provincia.',
        redirectTo: undefined,
      }
    }

    const existingPet = petId
      ? await prisma.adoptionPet.findUnique({
          where: { id: petId },
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        })
      : null

    if (petId && !existingPet) {
      return {
        status: 'error' as const,
        message: 'No encontramos el animal que querés editar.',
        redirectTo: undefined,
      }
    }

    if (!existingPet && imageFiles.length === 0) {
      return {
        status: 'error' as const,
        message: 'Subí al menos una imagen.',
        redirectTo: undefined,
      }
    }

    const currentImageCount = existingPet
      ? existingPet.images.filter((image) => !deleteImageIds.includes(image.id)).length
      : 0

    if (currentImageCount + imageFiles.length > 3) {
      return {
        status: 'error' as const,
        message: 'Cada animal puede tener hasta 3 imágenes.',
        redirectTo: undefined,
      }
    }

    const uploadedImages = await Promise.all(
      imageFiles.slice(0, 3).map(async (file, index) => {
        const tempPath = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`
        const uploaded = await uploadProductImage(tempPath, 'patitas-andinas/adoptions')

        return {
          url: uploaded.secure_url,
          cloudinaryId: uploaded.public_id,
          alt: `${name} ${currentImageCount + index + 1}`,
          sortOrder: currentImageCount + index,
        }
      }),
    )

    if (existingPet && deleteImageIds.length > 0) {
      const imagesToDelete = existingPet.images.filter((image) => deleteImageIds.includes(image.id))
      await Promise.all(
        imagesToDelete.map((image) => (image.cloudinaryId ? deleteProductImage(image.cloudinaryId) : Promise.resolve())),
      )
    }

    const status =
      statusValue === AdoptionStatus.ADOPTADO
        ? AdoptionStatus.ADOPTADO
        : statusValue === AdoptionStatus.EN_TRANSITO
          ? AdoptionStatus.EN_TRANSITO
          : AdoptionStatus.EN_ADOPCION

    if (existingPet) {
      await prisma.adoptionPet.update({
        where: { id: existingPet.id },
        data: {
          name,
          ageLabel,
          city,
          province,
          contactPhone: contactPhone || null,
          summary: summary || null,
          status,
          images: {
            ...(deleteImageIds.length > 0 ? { deleteMany: { id: { in: deleteImageIds } } } : {}),
            ...(uploadedImages.length > 0 ? { create: uploadedImages } : {}),
          },
        },
      })
    } else {
      await prisma.adoptionPet.create({
        data: {
          name,
          ageLabel,
          city,
          province,
          contactPhone: contactPhone || null,
          summary: summary || null,
          status,
          images: {
            create: uploadedImages,
          },
        },
      })
    }

    revalidatePath('/')
    revalidatePath('/adoptame')
    revalidatePath('/transito')

    return {
      status: 'success' as const,
      message: existingPet ? 'Animal actualizado correctamente.' : 'Animal agregado correctamente.',
      redirectTo: '/transito?saved=' + (existingPet ? 'updated' : 'created'),
    }
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'No se pudo guardar el animal.',
      redirectTo: undefined,
    }
  }
}

export async function deleteAdoptionPetAction(formData: FormData) {
  const petId = String(formData.get('petId') ?? '').trim()

  if (!petId) {
    return
  }

  const pet = await prisma.adoptionPet.findUnique({
    where: { id: petId },
    include: {
      images: true,
    },
  })

  if (!pet) {
    return
  }

  await Promise.all(
    pet.images.map((image) => (image.cloudinaryId ? deleteProductImage(image.cloudinaryId) : Promise.resolve())),
  )

  await prisma.adoptionPet.delete({
    where: { id: petId },
  })

  revalidatePath('/')
  revalidatePath('/adoptame')
  revalidatePath('/transito')
}
