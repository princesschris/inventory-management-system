import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getStatus } from '../lib/productStatus'
import StatusBadge from '../components/StatusBadge'
import StockHistory from '../components/StockHistory'
import Pagination from '../components/Pagination'
import { LayersIcon, SearchIcon } from '../components/Icons'
import './Products.css'
import { useAuth } from '../context/AuthContext'
import './Stock.css'

export default function Stock() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [historyKey, setHistoryKey] = useState(0)
  const { isAdmin } = useAuth()

  // Table filters and paging
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Stock movement dialog
  const [movement, setMovement] = useState(null) // { product, type }
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, quantity, minimum_stock')
      .order('name')

    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term)
      const matchesStatus = status === 'all' || getStatus(p).level === status
      return matchesSearch && matchesStatus
    })
  }, [products, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Dialog values
  const qty = parseInt(quantity, 10)
  const validQty = Number.isInteger(qty) && qty > 0
  const newStock =
    movement && validQty
      ? movement.type === 'IN'
        ? movement.product.quantity + qty
        : movement.product.quantity - qty
      : null
  const insufficient = newStock !== null && newStock < 0

  function openDialog(product, type) {
    setMovement({ product, type })
    setQuantity('')
    setDialogError('')
  }

  function closeDialog() {
    if (!submitting) setMovement(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!movement || !validQty || insufficient) return

    setSubmitting(true)
    setDialogError('')

    const { data, error } = await supabase.rpc('record_stock_movement', {
      p_product_id: movement.product.id,
      p_type: movement.type,
      p_quantity: qty,
    })
    setSubmitting(false)

    if (error) {
      setDialogError(error.message)
      return
    }

    const isIn = movement.type === 'IN'
    setNotice(
      `${isIn ? 'Added' : 'Removed'} ${qty} unit${qty === 1 ? '' : 's'} ${
        isIn ? 'to' : 'from'
      } ${movement.product.name}. New stock: ${data}.`
    )
    setMovement(null)
    setHistoryKey((k) => k + 1)
    loadProducts()
    setTimeout(() => setNotice(''), 6000)
  }

  if (loading) return <p className="page-loading">Loading...</p>

  if (products.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Stock</h1>
            <p className="page-subtitle">Record stock coming in and going out</p>
          </div>
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="table-card empty-state">
          <p>
            {isAdmin
              ? 'Add a product first before recording stock movements.'
              : 'No products yet. Ask the business owner to add products first.'}
          </p>
          {isAdmin && (
            <Link to="/products/add" className="btn btn-primary">
              Add product
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock</h1>
          <p className="page-subtitle">Record stock coming in and going out</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {notice && <div className="alert-success">{notice}</div>}

      {/* Stock levels */}
      <div className="table-card has-header stock-section">
        <div className="card-header">
          <h2>
            <LayersIcon size={20} /> Stock Levels
          </h2>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            className="filter-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by stock status"
          >
            <option value="all">All stock statuses</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No products match your search or filter.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>In stock</th>
                    <th>Minimum</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => (
                    <tr key={p.id}>
                      <td className="product-name">{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.quantity}</td>
                      <td>{p.minimum_stock}</td>
                      <td>
                        <StatusBadge product={p} />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn-success-outline btn-sm"
                            onClick={() => openDialog(p, 'IN')}
                          >
                            Stock In
                          </button>
                          <button
                            className="btn btn-danger-outline btn-sm"
                            onClick={() => openDialog(p, 'OUT')}
                            disabled={p.quantity === 0}
                          >
                            Stock Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              total={filtered.length}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n)
                setPage(1)
              }}
            />
          </>
        )}
      </div>

      {/* History */}
      <StockHistory refreshKey={historyKey} />

      {/* Stock In / Stock Out dialog */}
      {movement && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <form
            className="dialog"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h2>
              {movement.type === 'IN' ? 'Stock In' : 'Stock Out'}:{' '}
              {movement.product.name}
            </h2>
            <p className="dialog-sub">
              Current stock: {movement.product.quantity}
            </p>

            {dialogError && <div className="alert-error">{dialogError}</div>}

            <div className="form-group">
              <label htmlFor="movement-qty">
                Quantity to {movement.type === 'IN' ? 'add' : 'remove'}
              </label>
              <input
                id="movement-qty"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
                required
              />
            </div>

            {validQty && !insufficient && (
              <p className="movement-result">
                {movement.product.quantity} {movement.type === 'IN' ? '+' : '−'}{' '}
                {qty} = <strong>{newStock}</strong> in stock
              </p>
            )}

            {insufficient && (
              <p className="hint-error">
                Not enough stock. Only {movement.product.quantity} available.
              </p>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !validQty || insufficient}
              >
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}