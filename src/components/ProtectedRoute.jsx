import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../pages/Auth.css'

export default function ProtectedRoute({ children }) {
  const { user, profile, profileError, loading, profileLoading, logout } = useAuth()

  if (loading || profileLoading) return <p className="page-loading">Loading...</p>
  if (!user) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Account setup incomplete</h1>
          <p className="auth-subtitle">
            Your account exists, but the app could not load its profile.
          </p>
          {profileError && <div className="auth-error">{profileError}</div>}
          <button onClick={logout}>Log out</button>
        </div>
      </div>
    )
  }

  if (!profile.active) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Account not active</h1>
          <p className="auth-subtitle">
            Your account has been created, but the business owner needs to approve
            it before you can use StockEase.
          </p>
          <button onClick={logout}>Log out</button>
        </div>
      </div>
    )
  }

  return children
}