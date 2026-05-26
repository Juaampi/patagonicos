import { products } from '../lib/store-data'

console.table(
  products.map((product) => ({
    name: product.name,
    category: product.category,
    price: product.price,
  })),
)
