import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import { isStrongPassword } from '../lib/passwordRules'
import './Products.css'
import './Profile.css'

export default function Profile() {
  const { user, profile, isStaff, refreshProfile } = useAuth()

  const [businessName, setBusinessName] = useState('')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMessage, setNameMessage] = useState({ type: '', text: '' })

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    async function loadBusiness() {
      const { data } = await supabase.from('businesses').select('name').maybeSingle()
      setBusinessName(data?.name ?? '')
    }
    loadBusiness()
  }, [])

  async function saveName(e) {
    e.preventDefault()
    const trimmed = fullName.trim()

    if (!trimmed) {
      setNameMessage({ type: 'error', text: 'Your name cannot be empty.' })
      return
    }

    setNameSaving(true)
    setNameMessage({ type: '', text: '' })

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', user.id)
      .select('id')

    if (error || !data || data.length === 0) {
      setNameMessage({
        type: 'error',
        text: error?.message ?? 'Could not update your name.',
      })
    } else {
      await refreshProfile()
      setNameMessage({ type: 'success', text: 'Name updated.' })
    }
    setNameSaving(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    if (!isStrongPassword(password)) {
      setPasswordMessage({
        type: 'error',
        text: 'Please choose a stronger password that meets all the requirements.',
      })
      return
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setPasswordSaving(false)

    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPassword('')
      setConfirmPassword('')
      setPasswordMessage({ type: 'success', text: 'Password updated.' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p className="page-subtitle">Your details and password</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="form-card">
          <h2 className="profile-title">Account</h2>
          <dl className="profile-facts">
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Role</dt>
            <dd>{isStaff ? 'Staff' : 'Business Owner'}</dd>
            <dt>Business</dt>
            <dd>{businessName || '—'}</dd>
          </dl>
        </div>

        <form className="form-card" onSubmit={saveName}>
          <h2 className="profile-title">Display name</h2>

          {nameMessage.text && (
            <div className={nameMessage.type === 'error' ? 'alert-error' : 'alert-success'}>
              {nameMessage.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={nameSaving}>
            {nameSaving ? 'Saving...' : 'Save name'}
          </button>
        </form>

        <form className="form-card" onSubmit={savePassword}>
          <h2 className="profile-title">Change password</h2>

          {passwordMessage.text && (
            <div
              className={passwordMessage.type === 'error' ? 'alert-error' : 'alert-success'}
            >
              {passwordMessage.text}
            </div>
          )}

          <div className="form-group">
            <label>New password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </div>

          <div className="form-group">
            <label>Confirm new password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
            {passwordSaving ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}