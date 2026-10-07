import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileState, setProfileState] = useState({
    userId: null,
    profile: null,
    error: '',
  })

  const userId = user?.id

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // Load the person's profile (name and role) once we know who they are
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('id, full_name, role, active, business_id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          setProfileState({ userId, profile: data, error: error?.message ?? '' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, active, business_id')
      .eq('id', userId)
      .maybeSingle()
    setProfileState({ userId, profile: data, error: error?.message ?? '' })
  }, [userId])

  const isCurrent = !!userId && profileState.userId === userId
  const profile = isCurrent ? profileState.profile : null
  const profileError = isCurrent ? profileState.error : ''
  const profileLoading = !!userId && !isCurrent

  const register = ({ email, password, fullName, joinAs, businessName, businessCode }) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          join_as: joinAs,
          business_name: businessName,
          business_code: businessCode,
        },
      },
    })

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const logout = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
        loading,
        profileLoading,
        role: profile?.role ?? null,
        isAdmin: profile?.role === 'admin',
        isStaff: profile?.role === 'staff',
        refreshProfile,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}