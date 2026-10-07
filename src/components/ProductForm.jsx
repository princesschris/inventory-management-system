import { useState } from 'react'
import { Link } from 'react-router-dom'

const CATEGORY_SUGGESTIONS = [
  'Food',
  'Beverages',
  'Dairy',
  'Electronics',
  'Cosmetics',
  'Household',
  'Other',
]

export default function ProductForm({
  initialValues,
  onSubmit,
  submitLabel,
  submitting,
  error,
  lockQuantity = false,
}) {
  const [values, setValues] = useState({
    name: initialValues?.name ?? '',
    category: initialValues?.category ?? '',
    description: initialValues?.description ?? '',
    price: initialValues?.price ?? '',
    quantity: initialValues?.quantity ?? '',
    minimum_stock: initialValues?.minimum_stock ?? '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      quantity: parseInt(values.quantity, 10),
      minimum_stock: parseInt(values.minimum_stock, 10),
    }
    if (lockQuantity) delete payload.quantity
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Product name</label>
        <input
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          list="category-options"
          value={values.category}
          onChange={handleChange}
          placeholder="Pick one or type your own"
          required
        />
        <datalist id="category-options">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="price">Selling price (₦)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={handleChange}
            disabled={lockQuantity}
            required={!lockQuantity}
          />
          {lockQuantity && (
            <small className="form-note">
              Change this from the <Link to="/stock">Stock page</Link>.
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="minimum_stock">Minimum stock</label>
          <input
            id="minimum_stock"
            name="minimum_stock"
            type="number"
            min="0"
            step="1"
            value={values.minimum_stock}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <Link to="/products" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  )
}