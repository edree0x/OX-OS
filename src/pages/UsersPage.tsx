import type { User } from '../types'
import { USERS } from '../services/authService'
import { Card } from '../components/ui/primitives'

const PERMS = ['dashboard', 'pos', 'reports', 'settings', 'admin']

export default function UsersPage() {
  const users = USERS as User[]
  const roles = ['admin', 'manager', 'cashier', 'staff']

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">User Management (RBAC)</h2>
      <Card className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              {PERMS.map((p) => (
                <th key={p} className="px-3 py-2 capitalize">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-700">
                  {u.name}
                  <span className="block text-xs text-slate-400">{u.username}</span>
                </td>
                <td className="px-3 py-2 capitalize">{u.role}</td>
                {PERMS.map((p) => (
                  <td key={p} className="px-3 py-2">
                    {p === 'admin' ? u.role === 'admin' : roles.indexOf(u.role) <= roles.indexOf('manager') ? '✓' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-400">
          Managers and above get access to pos, reports, dashboard. Only admin can change settings / user management.
        </p>
      </Card>
    </div>
  )
}
