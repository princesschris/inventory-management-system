import StockHistory from '../components/StockHistory'
import './Products.css'
import './Stock.css'

export default function History() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory History</h1>
          <p className="page-subtitle">Every stock in and stock out, newest first</p>
        </div>
      </div>

      <StockHistory />
    </div>
  )
}