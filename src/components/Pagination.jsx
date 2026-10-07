const ROW_OPTIONS = [5, 10, 20, 50]

export default function Pagination({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))
  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const end = Math.min(page * rowsPerPage, total)

  // Show up to 5 page numbers around the current page
  let firstPage = Math.max(1, page - 2)
  const lastPage = Math.min(totalPages, firstPage + 4)
  firstPage = Math.max(1, lastPage - 4)
  const pages = Array.from({ length: lastPage - firstPage + 1 }, (_, i) => firstPage + i)

  return (
    <div className="pagination">
      <p>
        Showing {start} to {end} of {total} entries
      </p>

      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((n) => (
          <button
            key={n}
            className={`page-btn ${n === page ? 'active' : ''}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}

        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <label className="rows-per-page">
        Rows per page
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        >
          {ROW_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}