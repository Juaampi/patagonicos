import { sampleOrders } from './store-data'
import type { Product } from '@/types/store'
import {
  getCatalogProductBySlug,
  getCatalogProducts,
  getFeaturedCatalogProducts,
  getRelatedCatalogProducts,
} from './server/catalog'

export async function getAllProducts() {
  return getCatalogProducts()
}

export async function getFeaturedProducts(animalType?: Product['animalType']) {
  const products = await getFeaturedCatalogProducts()
  return animalType ? products.filter((product) => product.animalType === animalType) : products
}

export async function getStarProduct(animalType?: Product['animalType']) {
  const products = await getCatalogProducts()
  const filtered = animalType ? products.filter((product) => product.animalType === animalType) : products
  return filtered[0] ?? products[0]
}

export async function getProductBySlug(slug: string) {
  return getCatalogProductBySlug(slug)
}

export async function getRelatedProducts(slug: string) {
  return getRelatedCatalogProducts(slug)
}

export async function getProductsByAnimal(animalType: Product['animalType']) {
  const products = await getCatalogProducts()
  return products.filter((product) => product.animalType === animalType)
}

export function groupProductsByCategory(products: Product[]) {
  return products.reduce(
    (acc, product) => {
      const current = acc.get(product.category) ?? []
      current.push(product)
      acc.set(product.category, current)
      return acc
    },
    new Map<string, Product[]>(),
  )
}

export function getOrdersForProfile() {
  return sampleOrders
}
