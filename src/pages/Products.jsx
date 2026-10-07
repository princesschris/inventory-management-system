import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../lib/format'
import { getStatus } from '../lib/productStatus'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { DownloadIcon, ListIcon, SearchIcon } from '../components/Icons'
import './Products.css'

export default function Products() {
  const { isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get('q') ?? ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Filters and paging
  const [search, setSearch] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  // When the top bar search changes the URL, copy it into the search box
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearch(urlSearch)
    setPage(1)
  }

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setProducts(data)
      setLoading(false)
    }
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    const unique = new Map()
    products.forEach((p) => {
      const name = p.category?.trim()
      if (name && !unique.has(name.toLowerCase())) {
        unique.set(name.toLowerCase(), name)
      }
    })
    return [...unique.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [products])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.category ?? '').toLowerCase().includes(term)

      const matchesCategory =
        category === 'all' ||
        (p.category ?? '').trim().toLowerCase() === category

      const matchesStatus = status === 'all' || getStatus(p).level === status

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, search, category, status])

  const hasFilters = search !== '' || category !== 'all' || status !== 'all'

  // Paging
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * rowsPerPage
  const pageProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage)

  function updateSearch(value) {
    setSearch(value)
    setPage(1)
  }

  function updateCategory(value) {
    setCategory(value)
    setPage(1)
  }

  function updateStatus(value) {
    setStatus(value)
    setPage(1)
  }

  function clearFilters() {
    setSearch('')
    setCategory('all')
    setStatus('all')
    setPage(1)
  }

  function handleExport() {
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const header = [
      'Name',
      'Category',
      'Description',
      'Price',
      'Quantity',
      'Minimum stock',
      'Status',
    ]
    const lines = filteredProducts.map((p) =>
      [
        p.name,
        p.category,
        p.description,
        p.price,
        p.quantity,
        p.minimum_stock,
        getStatus(p).label,
      ]
        .map(quote)
        .join(',')
    )
    const csv = '\uFEFF' + [header.map(quote).join(','), ...lines].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'products.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    setDeleting(true)
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', toDelete.id)
      .select('id')
    setDeleting(false)

    if (error) {
      setError(error.message)
    } else if (!data || data.length === 0) {
      setError('You do not have permission to delete this product.')
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== toDelete.id))
    }
    setToDelete(null)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage everything you sell' : 'Browse your business products'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/products/add" className="btn btn-primary">
            + Add product
          </Link>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="table-card empty-state">
          {isAdmin ? (
            <>
              <p>You haven't added any products yet.</p>
              <Link to="/products/add" className="btn btn-primary">
                Add your first product
              </Link>
            </>
          ) : (
            <p>No products have been added yet. Ask the business owner to add them.</p>
          )}
        </div>
      ) : (
        <div className="table-card has-header">
          <div className="card-header">
            <h2>
              <ListIcon size={20} /> All Products
            </h2>
            {isAdmin && (
              <button
                className="btn btn-primary btn-with-icon"
                onClick={handleExport}
                disabled={filteredProducts.length === 0}
              >
                <DownloadIcon size={16} /> Export
              </button>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <SearchIcon size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={category}
              onChange={(e) => updateCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              aria-label="Filter by stock status"
            >
              <option value="all">All stock statuses</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            {hasFilters && (
              <button className="link-button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>No products match your search or filters.</p>
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pageProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="product-name">{product.name}</td>
                        <td>{product.category}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.quantity}</td>
                        <td>
                          <StatusBadge product={product} />
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="row-actions">
                              <Link
                                to={`/products/${product.id}`}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit
                              </Link>
                              <button
                                className="btn btn-danger-outline btn-sm"
                                onClick={() => setToDelete(product)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                total={filteredProducts.length}
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
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete product"
        message={
          toDelete
            ? `Are you sure you want to delete "${toDelete.name}"? This will also remove its stock history.`
            : ''
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}