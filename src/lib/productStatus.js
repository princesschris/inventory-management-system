export function getStatus(product) {
  if (product.quantity === 0) return { label: 'Out of Stock', level: 'out' }
  if (product.quantity <= product.minimum_stock) return { label: 'Low Stock', level: 'low' }
  return { label: 'In Stock', level: 'in' }
}