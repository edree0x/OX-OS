import { useEffect, useState } from 'react'

function fmt(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export default function SessionTimer({ ratePerHour, startedAt }: { ratePerHour: number; startedAt: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const elapsedMs = Math.max(0, now - startedAt)
  const minutes = elapsedMs / 60000
  const cost = minutes * ratePerHour
  return (
    <div className="rounded-lg bg-slate-900 p-3 text-center text-green-400">
      <p className="font-mono text-2xl">{fmt(elapsedMs)}</p>
      <p className="text-sm">{ratePerHour} /hr → {cost.toFixed(2)}</p>
    </div>
  )
}
