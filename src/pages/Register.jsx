import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import { isStrongPassword } from '../lib/passwordRules'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [joinAs, setJoinAs] = useState('owner') // 'owner' or 'staff'
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessCode, setBusinessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isStaff = joinAs === 'staff'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!isStrongPassword(password)) {
      setError('Please choose a stronger password that meets all the requirements.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const cleanCode = businessCode.replace(/[^a-z0-9]/gi, '').toUpperCase()
    setSubmitting(true)

    // Staff: check the business name and ID before creating the account
    if (isStaff) {
      const { data: exists, error: checkError } = await supabase.rpc(
        'business_exists',
        { p_name: businessName, p_code: cleanCode }
      )

      if (checkError) {
        setSubmitting(false)
        setError(checkError.message)
        return
      }
      if (!exists) {
        setSubmitting(false)
        setError(
          'Business name or ID is incorrect. Ask your business owner for the exact details.'
        )
        return
      }
    }

    const { data, error } = await register({
      email,
      password,
      fullName,
      joinAs,
      businessName: businessName.trim(),
      businessCode: cleanCode,
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate('/dashboard')
    } else {
      setMessage('Account created. Check your email to confirm it, then log in.')
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="auth-subtitle">
          {isStaff
            ? "Join your employer's business"
            : 'Set up your business'}
        </p>

        <div className="role-toggle">
          <button
            type="button"
            className={!isStaff ? 'active' : ''}
            onClick={() => setJoinAs('owner')}
          >
            Business owner
          </button>
          <button
            type="button"
            className={isStaff ? 'active' : ''}
            onClick={() => setJoinAs('staff')}
          >
            Staff member
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <label>Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label>Business name</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={isStaff ? 'Exactly as your employer gave it' : ''}
          required
        />

        {isStaff && (
          <>
            <label>Business ID</label>
            <input
              type="text"
              value={businessCode}
              onChange={(e) => setBusinessCode(e.target.value)}
              placeholder="e.g. K7MQ-4XPD"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
              required
            />
            <p className="field-hint">Ask your business owner for this.</p>
          </>
        )}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />

        <label>Confirm password</label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="field-hint error">Passwords do not match</p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}