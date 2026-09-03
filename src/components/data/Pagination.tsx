export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`h-8 w-8 rounded transition-colors ${
              page === i + 1
                ? 'bg-[var(--brand-primary)] text-white'
                : 'hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
