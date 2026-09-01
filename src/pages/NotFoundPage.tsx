import { Link } from 'react-router-dom'
import { Card } from '../components/ui/primitives'

export default function NotFoundPage() {
  return (
    <Card className="mx-auto mt-20 max-w-sm p-8 text-center">
      <p className="text-4xl font-bold text-indigo-500">404</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">Page not found</h2>
      <p className="mt-2 text-sm text-slate-400">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        Go home
      </Link>
    </Card>
  )
}
