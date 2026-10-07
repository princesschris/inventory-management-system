import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Staff from './pages/Staff'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import AddProduct from './pages/AddProduct'
import ProductDetails from './pages/ProductDetails'
import Stock from './pages/Stock'
import History from './pages/History'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route
              path="/products/add"
              element={<AdminRoute><AddProduct /></AdminRoute>}
            />
            <Route path="/staff" element={<AdminRoute><Staff /></AdminRoute>} />
            <Route path="/profile" element={<Profile />} /> 
            <Route
              path="/products/:id"
              element={<AdminRoute><ProductDetails /></AdminRoute>}
            />
            <Route path="/stock" element={<Stock />} />
            <Route path="/history" element={<History />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}