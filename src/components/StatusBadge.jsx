import { getStatus } from '../lib/productStatus'

export default function StatusBadge({ product }) {
  const status = getStatus(product)
  return <span className={`status-badge status-${status.level}`}>{status.label}</span>
}