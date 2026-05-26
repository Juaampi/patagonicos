import { notFound } from 'next/navigation'
import { AdminProductEditorPage } from '@/components/admin/admin-product-editor-page'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export default async function EditAdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const snapshot = await getAdminSnapshot()
  const editProduct = snapshot.products.find((product) => product.id === resolvedParams.id)

  if (!editProduct) {
    notFound()
  }

  return (
    <AdminProductEditorPage
      categories={snapshot.categories}
      mode="edit"
      editProduct={{
        id: editProduct.id,
        name: editProduct.name,
        slug: editProduct.slug,
        animalType: editProduct.animalType,
        mainImageUrl: editProduct.mainImageUrl,
        videoUrl: editProduct.videoUrl,
        price: editProduct.price,
        baseSalesCount: editProduct.baseSalesCount,
        compareAtPrice: editProduct.compareAtPrice,
        shortDescription: editProduct.shortDescription,
        description: editProduct.description,
        categoryId: editProduct.categoryId,
        status: editProduct.status,
        useTags: editProduct.useTags,
        featureTags: editProduct.featureTags,
        materials: editProduct.materials,
        careInstructions: editProduct.careInstructions,
        featured: editProduct.featured,
        productStar: editProduct.productStar,
        variants: editProduct.variants.map((variant) => ({
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          size: variant.size,
          stock: variant.stock,
          sku: variant.sku,
        })),
        images: editProduct.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          colorName: image.colorName ?? undefined,
          type: image.type,
          sortOrder: image.sortOrder,
        })),
      }}
    />
  )
}
