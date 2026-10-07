import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { formatDateTime } from '../lib/format'
import Pagination from './Pagination'
import { ListIcon } from './Icons'

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'IN', label: 'Stock In' },
  { value: 'OUT', label: 'Stock Out' },
]

export default function StockHistory({ refreshKey }) {
  const { user } = useAuth()

  const [rows, setRows] = useState([])
  const [people, setPeople] = useState({})
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    async function loadHistory() {
      let query = supabase
        .from('stock_transactions')
        .select('id, type, quantity, created_at, user_id, products(name)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (filter !== 'ALL') query = query.eq('type', filter)

      const [historyRes, peopleRes] = await Promise.all([
        query,
        supabase.from('profiles').select('id, full_name'),
      ])

      if (historyRes.error) {
        setError(historyRes.error.message)
      } else {
        setError('')
        setRows(historyRes.data)
        setPeople(
          Object.fromEntries(
            (peopleRes.data ?? []).map((p) => [p.id, p.full_name])
          )
        )
      }
      setLoading(false)
    }
    loadHistory()
  }, [filter, refreshKey])

  function changeFilter(value) {
    setFilter(value)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <section className="table-card has-header stock-section">
      <div className="card-header">
        <h2>
          <ListIcon size={20} /> Stock Movements
        </h2>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={filter === f.value ? 'active' : ''}
              onClick={() => changeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert-error history-error">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading history...</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <p>No stock movements recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Recorded by</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const isIn = row.type === 'IN'
                  const name = people[row.user_id] || 'Unknown'
                  return (
                    <tr key={row.id}>
                      <td className="product-name">
                        {row.products?.name ?? 'Deleted product'}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${isIn ? 'status-in' : 'status-out'}`}
                        >
                          {isIn ? 'Stock In' : 'Stock Out'}
                        </span>
                      </td>
                      <td className={isIn ? 'qty-in' : 'qty-out'}>
                        {isIn ? '+' : '-'}
                        {row.quantity}
                      </td>
                      <td>
                        {name}
                        {row.user_id === user?.id ? ' (you)' : ''}
                      </td>
                      <td>{formatDateTime(row.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            total={rows.length}
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
    </section>
  )
}