import { Link } from 'react-router-dom'
import { Card } from '../components/ui/primitives'

export default function NotFoundPage() {
  return (
    <Card className="mx-auto mt-20 max-w-sm p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-800">404 — Not found</h2>
      <p className="mt-2 text-sm text-slate-400">This page does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Go home
      </Link>
    </Card>
  )
}
