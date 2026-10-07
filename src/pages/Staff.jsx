import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { UsersIcon } from '../components/Icons'
import './Products.css'
import './Staff.css'

const formatCode = (code) => `${code.slice(0, 4)}-${code.slice(4)}`

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export default function Staff() {
  const { user } = useAuth()

  const [team, setTeam] = useState([])
  const [business, setBusiness] = useState({ name: '', code: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [toDeactivate, setToDeactivate] = useState(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    const [teamRes, nameRes, codeRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, role, active, created_at')
        .order('created_at'),
      supabase.from('businesses').select('name').maybeSingle(),
      supabase.rpc('my_business_code'),
    ])

    const failed = teamRes.error || nameRes.error || codeRes.error
    if (failed) {
      setError(failed.message)
    } else {
      setTeam(teamRes.data)
      setBusiness({ name: nameRes.data?.name ?? '', code: codeRes.data })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function showNotice(text) {
    setNotice(text)
    setTimeout(() => setNotice(''), 6000)
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

  async function setActive(person, active) {
    setError('')
    const { error } = await supabase.rpc('set_staff_active', {
      p_user_id: person.id,
      p_active: active,
    })

    if (error) {
      setError(error.message)
      return
    }

    setTeam((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, active } : p))
    )
    showNotice(
      `${person.full_name || 'Staff member'} ${active ? 'reactivated' : 'deactivated'}.`
    )
  }

  async function handleDeactivate() {
    setWorking(true)
    await setActive(toDeactivate, false)
    setWorking(false)
    setToDeactivate(null)
  }

  async function handleReactivate(person) {
    setBusyId(person.id)
    await setActive(person, true)
    setBusyId(null)
  }

  async function handleRegenerate() {
    setWorking(true)
    setError('')
    const { data, error } = await supabase.rpc('regenerate_business_code')
    setWorking(false)
    setConfirmRegen(false)

    if (error) {
      setError(error.message)
    } else {
      setBusiness((b) => ({ ...b, code: data }))
      showNotice('New Business ID generated. The old one no longer works.')
    }
  }

  if (loading) return <p className="page-loading">Loading...</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff</h1>
          <p className="page-subtitle">Manage your team and your Business ID</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {notice && <div className="alert-success">{notice}</div>}

      <div className="business-card">
        <div>
          <p className="business-label">Business name</p>
          <p className="business-value">{business.name}</p>
        </div>
        <div>
          <p className="business-label">Business ID</p>
          <p className="business-code">
            {business.code ? formatCode(business.code) : '—'}
          </p>
        </div>
        <div className="business-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={copyCode}
            disabled={!business.code}
          >
            {copied ? 'Copied' : 'Copy ID'}
          </button>
          <button
            className="btn btn-danger-outline btn-sm"
            onClick={() => setConfirmRegen(true)}
          >
            New ID
          </button>
        </div>
      </div>
      <p className="business-help">
        Staff register on the <strong>Staff member</strong> tab using your exact
        business name and this ID.
      </p>

      <div className="table-card has-header">
        <div className="card-header">
          <h2>
            <UsersIcon size={20} /> Your Team
          </h2>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((person) => (
                <tr key={person.id}>
                  <td className="product-name">
                    {person.full_name || 'Unnamed'}
                    {person.id === user.id ? ' (you)' : ''}
                  </td>
                  <td>
                    <span className={`role-badge ${person.role}`}>
                      {person.role === 'admin' ? 'Owner' : 'Staff'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${person.active ? 'status-in' : 'status-out'}`}
                    >
                      {person.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>{formatDate(person.created_at)}</td>
                  <td>
                    {person.role === 'admin' ? (
                      <span className="muted-dash">—</span>
                    ) : person.active ? (
                      <button
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => setToDeactivate(person)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleReactivate(person)}
                        disabled={busyId === person.id}
                      >
                        {busyId === person.id ? 'Working...' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {team.length <= 1 && (
          <div className="empty-state">
            <p>No staff have joined yet. Share your Business ID so they can register.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDeactivate}
        title="Deactivate staff member"
        message={
          toDeactivate
            ? `${toDeactivate.full_name || 'This person'} will lose access to ${business.name} straight away. You can reactivate them later.`
            : ''
        }
        confirmLabel="Deactivate"
        loadingLabel="Deactivating..."
        loading={working}
        onConfirm={handleDeactivate}
        onCancel={() => setToDeactivate(null)}
      />

      <ConfirmDialog
        open={confirmRegen}
        title="Generate a new Business ID"
        message="The current ID will stop working for new registrations. Staff who have already joined are not affected."
        confirmLabel="Generate new ID"
        loadingLabel="Generating..."
        confirmClass="btn-primary"
        loading={working}
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmRegen(false)}
      />
    </div>
  )
}