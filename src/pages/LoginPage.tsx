import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Card, Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { BrandLogo } from '../components/branding/BrandLogo'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const user = await login(username, password)
      if (user) navigate('/')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-4 flex items-center gap-2">
          <BrandLogo className="h-9 w-9" />
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sign in</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            <Icon name="logout" className="h-4 w-4" />
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
