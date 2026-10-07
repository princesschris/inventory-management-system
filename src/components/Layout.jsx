import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getStatus } from '../lib/productStatus'
import {
  HomeIcon,
  BoxIcon,
  LayersIcon,
  ClockIcon,
  SearchIcon,
  CalendarIcon,
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
} from './Icons'
import './Layout.css'

// K7MQ4XPD -> K7MQ-4XPD
const formatCode = (code) => `${code.slice(0, 4)}-${code.slice(4)}`

export default function Layout() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [business, setBusiness] = useState({
    status: 'loading',
    name: '',
    code: null,
    error: '',
  })

  // The role comes straight from the person's profile
  const isAdmin = profile?.role === 'admin'
  const isStaff = profile?.role === 'staff'
  const roleLabel = !profile ? 'No role' : isStaff ? 'Staff' : 'Business Owner'

  const fullName =
    profile?.full_name || user.user_metadata?.full_name || user.email
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Count products that are low or out of stock (refreshes on every page change)
  useEffect(() => {
    async function loadAlerts() {
      const { data } = await supabase
        .from('products')
        .select('quantity, minimum_stock')
      if (data) {
        setAlertCount(data.filter((p) => getStatus(p).level !== 'in').length)
      }
    }
    loadAlerts()
  }, [location.pathname])

  // Business name for everyone, Business ID for the owner only
  const businessId = profile?.business_id

  useEffect(() => {
    if (!businessId) return
    let cancelled = false

    async function loadBusiness() {
      const nameRes = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .maybeSingle()

      const codeRes = isAdmin
        ? await supabase.rpc('my_business_code')
        : { data: null }

      if (cancelled) return

      if (nameRes.error) {
        setBusiness({
          status: 'error',
          name: '',
          code: null,
          error: nameRes.error.message,
        })
        return
      }

      setBusiness({
        status: 'ready',
        name: nameRes.data?.name ?? '',
        code: codeRes.data ?? null,
        error: '',
      })
    }
    loadBusiness()

    return () => {
      cancelled = true
    }
  }, [businessId, isAdmin])

  // Ctrl+K (or Cmd+K) focuses the search box
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const term = searchTerm.trim()
    navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products')
    searchRef.current?.blur()
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(formatCode(business.code))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked by the browser
    }
  }

  let businessLabel
  if (!businessId) businessLabel = 'No business linked'
  else if (business.status === 'loading') businessLabel = 'Loading...'
  else if (business.status === 'error') businessLabel = 'Could not load'
  else businessLabel = business.name || 'Unnamed business'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">
            <BoxIcon size={22} />
          </span>
          <div>
            <p className="brand-name">
              Stock<span>Ease</span>
            </p>
            <p className="brand-tagline">Inventory made simple</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">
            <HomeIcon /> Dashboard
          </NavLink>
          <NavLink to="/products">
            <BoxIcon /> Products
          </NavLink>
          <NavLink to="/stock">
            <LayersIcon /> Stock
          </NavLink>
          <NavLink to="/history">
            <ClockIcon /> History
          </NavLink>
        </nav>

        <div className="sidebar-promo">
          <p>Keep your shelves full with accurate stock tracking</p>
          <NavLink to="/stock" className="promo-button">
            Record Stock <span>›</span>
          </NavLink>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <form className="topbar-search" onSubmit={handleSearch}>
            <SearchIcon size={18} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <kbd>Ctrl + K</kbd>
          </form>

          <div className="topbar-right">
            <div className="topbar-date">
              <CalendarIcon size={18} />
              {today}
            </div>

            <button
              className="icon-button"
              onClick={() => navigate('/dashboard')}
              aria-label={`${alertCount} products need attention`}
              title={
                alertCount > 0
                  ? `${alertCount} product(s) need attention`
                  : 'No stock alerts'
              }
            >
              <BellIcon size={20} />
              {alertCount > 0 && <span className="bell-dot" />}
            </button>

            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="avatar">{initials}</span>
                <span className="user-info">
                  <strong>{fullName}</strong>
                  <small>{roleLabel}</small>
                </span>
                <ChevronDownIcon size={16} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="menu-backdrop"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="user-dropdown">
                    <p className="dropdown-email">{user.email}</p>

                    <div className="dropdown-business">
                      <p className="dropdown-label">Business</p>
                      <p className="dropdown-value">{businessLabel}</p>
                      {business.status === 'error' && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                          {business.error}
                        </p>
                      )}

                      <p className="dropdown-label">Role</p>
                      <p className="dropdown-value">{roleLabel}</p>

                      {isAdmin && business.code && (
                        <>
                          <p className="dropdown-label">
                            Business ID (share with your staff)
                          </p>
                          <div className="dropdown-code">
                            <strong>{formatCode(business.code)}</strong>
                            <button className="copy-button" onClick={copyCode}>
                              {copied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button onClick={logout}>
                      <LogOutIcon size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}