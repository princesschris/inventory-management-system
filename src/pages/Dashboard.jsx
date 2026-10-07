import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getStatus } from '../lib/productStatus'
import { formatDateTime } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import Sparkline from '../components/Sparkline'
import { useAuth } from '../context/AuthContext'
import {
  BoxIcon,
  LayersIcon,
  AlertIcon,
  XCircleIcon,
  ListIcon,
} from '../components/Icons'
import './Products.css'
import './Dashboard.css'

// The last n days as midnight dates, oldest first
function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

function keyOf(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function cumulative(values) {
  let sum = 0
  return values.map((v) => (sum += v))
}

export default function Dashboard() {
  const [days, setDays] = useState(7)
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { isAdmin } = useAuth()

  useEffect(() => {
    async function loadDashboard() {
      const since = lastNDays(days)[0].toISOString()

      const [productsRes, movementsRes, recentRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, quantity, minimum_stock, created_at'),
        supabase
          .from('stock_transactions')
          .select('type, quantity, created_at')
          .gte('created_at', since),
        supabase
          .from('stock_transactions')
          .select('id, type, quantity, created_at, products(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const failed = productsRes.error || movementsRes.error || recentRes.error
      if (failed) {
        setError(failed.message)
      } else {
        setError('')
        setProducts(productsRes.data)
        setMovements(movementsRes.data)
        setRecent(recentRes.data)
      }
      setLoading(false)
    }
    loadDashboard()
  }, [days])

  if (loading) return <p className="page-loading">Loading dashboard...</p>

  const dayList = lastNDays(days)
  const period = days === 7 ? 'this week' : 'this month'

  // Headline numbers
  const totalProducts = products.length
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0)
  const lowStock = products.filter((p) => getStatus(p).level === 'low').length
  const outOfStock = products.filter((p) => getStatus(p).level === 'out').length

  // New products in the period
  const newByDay = new Map(dayList.map((d) => [keyOf(d), 0]))
  let newProducts = 0
  products.forEach((p) => {
    const created = new Date(p.created_at)
    if (created >= dayList[0]) {
      newProducts += 1
      const key = keyOf(created)
      newByDay.set(key, (newByDay.get(key) ?? 0) + 1)
    }
  })

  // Net stock movement in the period
  const netByDay = new Map(dayList.map((d) => [keyOf(d), 0]))
  let netChange = 0
  movements.forEach((m) => {
    const delta = m.type === 'IN' ? m.quantity : -m.quantity
    netChange += delta
    const key = keyOf(new Date(m.created_at))
    netByDay.set(key, (netByDay.get(key) ?? 0) + delta)
  })

  const productTrend =
    newProducts > 0
      ? { dir: 'up', text: `${newProducts} new ${period}` }
      : { dir: 'flat', text: `No new products ${period}` }

  const itemsTrend =
    netChange > 0
      ? { dir: 'up', text: `${netChange.toLocaleString()} more items ${period}` }
      : netChange < 0
        ? { dir: 'down', text: `${Math.abs(netChange).toLocaleString()} fewer items ${period}` }
        : { dir: 'flat', text: `No net change ${period}` }

  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      tone: 'blue',
      icon: <BoxIcon size={22} />,
      trend: productTrend,
      series: cumulative(dayList.map((d) => newByDay.get(keyOf(d)))),
    },
    {
      label: 'Total Items in Stock',
      value: totalItems,
      tone: 'green',
      icon: <LayersIcon size={22} />,
      trend: itemsTrend,
      series: cumulative(dayList.map((d) => netByDay.get(keyOf(d)))),
    },
    {
      label: 'Low Stock',
      value: lowStock,
      tone: 'orange',
      icon: <AlertIcon size={22} />,
      trend: { dir: 'flat', text: 'At or below minimum' },
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      tone: 'red',
      icon: <XCircleIcon size={22} />,
      trend: { dir: 'flat', text: 'Quantity is zero' },
    },
  ]

  const needsAttention = products
    .filter((p) => getStatus(p).level !== 'in')
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory</p>
        </div>

        <select
          className="period-select"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time period"
        >
          <option value={7}>This Week</option>
          <option value={30}>This Month</option>
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-top">
              <span className={`stat-icon ${stat.tone}`}>{stat.icon}</span>
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-bottom">
              <p className={`stat-trend ${stat.trend.dir}`}>
                {stat.trend.dir === 'up' && '↑ '}
                {stat.trend.dir === 'down' && '↓ '}
                {stat.trend.text}
              </p>
              {stat.series && (
                <span className={`stat-spark ${stat.trend.dir}`}>
                  <Sparkline data={stat.series} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent activity table */}
        <div className="table-card has-header">
          <div className="card-header">
            <h2>
              <ListIcon size={20} /> Recent Stock Activity
            </h2>
            <Link to="/stock" className="btn btn-secondary btn-sm">
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="panel-empty">No stock movements yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table activity-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Action</th>
                    <th>Quantity</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => {
                    const isIn = item.type === 'IN'
                    return (
                      <tr key={item.id}>
                        <td className="product-name">
                          {item.products?.name ?? 'Deleted product'}
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
                          {item.quantity}
                        </td>
                        <td>{formatDateTime(item.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div className="panel">
          <div className="panel-header">
            <h2>Needs attention</h2>
            <Link to="/products">View products</Link>
          </div>

          {needsAttention.length === 0 ? (
            <p className="panel-empty">
              {totalProducts === 0 ? isAdmin
                  ? 'Add products to start tracking stock.'
                  : 'No products have been added yet.'
                  : 'Everything is well stocked.'}
            </p>
          ) : (
            <ul className="attention-list">
              {needsAttention.map((p) => (
                <li key={p.id} className="attention-item">
                  <div>
                    <p className="attention-name">{p.name}</p>
                    <p className="attention-meta">
                      {p.quantity} in stock · minimum {p.minimum_stock}
                    </p>
                  </div>
                  <StatusBadge product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}