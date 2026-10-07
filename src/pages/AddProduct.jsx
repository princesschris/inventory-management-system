import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductForm from '../components/ProductForm'
import './Products.css'

export default function AddProduct() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(product) {
    setError('')
    setSubmitting(true)

    const { error } = await supabase.from('products').insert(product)
    setSubmitting(false)

    if (error) setError(error.message)
    else navigate('/products')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Add product</h1>
      </div>
      <div className="form-card">
        <ProductForm
          onSubmit={handleCreate}
          submitLabel="Add product"
          submitting={submitting}
          error={error}
        />
      </div>
    </div>
  )
}