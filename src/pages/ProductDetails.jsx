import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductForm from '../components/ProductForm'
import './Products.css'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) setError(error.message)
      else setProduct(data)
      setLoading(false)
    }
    loadProduct()
  }, [id])

  async function handleUpdate(values) {
    setError('')
    setSaving(true)

    const { error } = await supabase.from('products').update(values).eq('id', id)
    setSaving(false)

    if (error) setError(error.message)
    else navigate('/products')
  }

  if (loading) return <p className="page-loading">Loading product...</p>

  if (!product) {
    return (
      <div className="form-card">
        <p>Product not found.</p>
        <Link to="/products" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Edit product</h1>
      </div>
      <div className="form-card">
        <ProductForm
            initialValues={product}
            onSubmit={handleUpdate}
            submitLabel="Save changes"
            submitting={saving}
            error={error}
            lockQuantity
            />
      </div>
    </div>
  )
}