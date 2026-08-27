import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Card, Button } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'

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
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">E</div>
          <h1 className="text-lg font-semibold text-slate-800">Sign in</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full">
            <Icon name="logout" className="h-4 w-4" />
            Login
          </Button>
        </form>
        <p className="mt-3 text-center text-xs text-slate-400">admin / manager / cashier / staff</p>
      </Card>
    </div>
  )
}
