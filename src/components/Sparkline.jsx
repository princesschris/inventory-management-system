export default function Sparkline({ data, width = 84, height = 30 }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data
    .map((value, i) => {
      const x = (i * step).toFixed(1)
      const y = (height - 3 - ((value - min) / range) * (height - 6)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')

  const area = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon points={area} fill="currentColor" opacity="0.12" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}