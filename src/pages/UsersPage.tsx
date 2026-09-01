import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, Modal, Badge, Spinner } from '../components/ui/primitives'
import { Icon } from '../components/ui/Icon'
import { notify } from '../components/ui/Toast'
import { listUsers, createUser, updateUser, deleteUser, listRoles, rolePermissions, type StoredUser, type UserInput } from '../services/userService'
import { useAuthStore } from '../stores/authStore'
import type { Role, PermissionKey } from '../types'

const ROLE_RANK: Record<Role, number> = { staff: 0, cashier: 1, manager: 2, admin: 3 }
const ROLE_TONES: Record<Role, 'slate' | 'green' | 'red' | 'indigo' | 'amber'> = {
  admin: 'red',
  manager: 'amber',
  cashier: 'indigo',
  staff: 'slate',
}

function RoleMatrix() {
  const roles = listRoles()
  const perms = [
    { key: 'dashboard', label: 'Dashboard', check: (r: Role) => ROLE_RANK[r] >= ROLE_RANK.staff },
    { key: 'pos', label: 'POS & Billing', check: (r: Role) => ROLE_RANK[r] >= ROLE_RANK.cashier || r === 'admin' },
    { key: 'reports', label: 'Reports', check: (r: Role) => ROLE_RANK[r] >= ROLE_RANK.manager },
    { key: 'rbac', label: 'User Management', check: (r: Role) => r === 'admin' },
    { key: 'settings', label: 'Settings', check: (r: Role) => r === 'admin' },
    { key: 'manageFields', label: 'Manage entity fields', check: (r: Role) => rolePermissions(r).includes('manageFields') },
  ]
  return (
    <Card className="overflow-x-auto p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Permission matrix by role</h3>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <th className="px-3 py-2">Role</th>
            {perms.map((p) => (
              <th key={p.key} className="px-3 py-2 capitalize">
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role} className="border-b border-slate-100">
              <td className="px-3 py-2">
                <Badge tone={ROLE_TONES[role]}>{role}</Badge>
              </td>
              {perms.map((p) => (
                <td key={p.key} className="px-3 py-2">
                  {p.check(role) ? <Icon name="check" className="h-4 w-4 text-green-600" /> : <span className="text-slate-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

const emptyForm = (): UserInput => ({ username: '', name: '', role: 'cashier', password: '', active: true, permissions: [] })

export default function UsersPage() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StoredUser | null>(null)
  const [form, setForm] = useState<UserInput>(emptyForm())

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })
  const create = useMutation({ mutationFn: createUser, onSuccess: invalidate })
  const update = useMutation({ mutationFn: ({ id, patch }: { id: string; patch: Partial<UserInput> }) => updateUser(id, patch), onSuccess: invalidate })
  const remove = useMutation({ mutationFn: deleteUser, onSuccess: invalidate })

  useEffect(() => {
    if (modalOpen && !editing) setForm(emptyForm())
  }, [modalOpen, editing])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }
  const openEdit = (u: StoredUser) => {
    setEditing(u)
    setForm({ username: u.username, name: u.name, role: u.role, password: '', active: u.active, permissions: u.permissions ?? [] })
    setModalOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const patch: Partial<UserInput> = { username: form.username, name: form.name, role: form.role, active: form.active, permissions: form.permissions }
      if (form.password) patch.password = form.password
      if (editing.id === currentUser?.id && form.username !== editing.username) {
        notify('Cannot rename the currently logged-in user', 'error')
        return
      }
      try {
        await update.mutateAsync({ id: editing.id, patch })
        notify('User updated', 'success')
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not update user', 'error')
      }
    } else {
      try {
        await create.mutateAsync(form)
        notify('User created', 'success')
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not create user', 'error')
      }
    }
    setModalOpen(false)
  }

  const toggleActive = async (u: StoredUser) => {
    if (u.id === currentUser?.id) {
      notify('You cannot deactivate your own account', 'error')
      return
    }
    try {
      await update.mutateAsync({ id: u.id, patch: { active: !u.active } })
      notify(u.active ? 'User deactivated' : 'User activated', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update user', 'error')
    }
  }

  const removeUser = async (u: StoredUser) => {
    if (u.id === currentUser?.id) {
      notify('You cannot delete your own account', 'error')
      return
    }
    if (!confirm(`Delete user "${u.name}"?`)) return
    try {
      await remove.mutateAsync(u.id)
      notify('User deleted', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete user', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">User Management</h2>
          <p className="text-xs text-slate-400">Add, edit, and control access for staff accounts.</p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="h-4 w-4" />
          New user
        </Button>
      </div>

      <Card className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 ${!u.active ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      <span className="flex items-center gap-2">
                        {u.name}
                        {u.id === currentUser?.id && <Badge tone="indigo">you</Badge>}
                      </span>
                      <span className="block text-xs text-slate-400">@{u.username}</span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={ROLE_TONES[u.role]}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {u.active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Disabled</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => toggleActive(u)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Toggle active" title={u.active ? 'Disable' : 'Enable'}>
                          <Icon name={u.active ? 'pause' : 'play'} className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(u)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Edit">
                          <Icon name="edit" className="h-4 w-4" />
                        </button>
                        <button onClick={() => removeUser(u)} className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete">
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RoleMatrix />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : 'New user'} size="md">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Full name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Ahmed Ali"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Username *</label>
            <input
              required
              value={form.username}
              disabled={editing?.id === currentUser?.id}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="e.g. ahmed.ali"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {listRoles().map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">
              admin: full control · manager: pos + reports · cashier: pos + dashboard · staff: dashboard
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">{editing ? 'New password (leave blank to keep current)' : 'Password'}</label>
            <input
              type="password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={editing ? '••••••' : 'Default: same as username'}
            />
          </div>
          {!editing && (
            <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-400">If left empty, the password defaults to the username.</p>
          )}
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Extra permissions</p>
            <label
              className={`flex items-center gap-2 text-sm ${form.role === 'admin' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
            >
              <input
                type="checkbox"
                checked={rolePermissions(form.role).includes('manageFields') || form.permissions?.includes('manageFields')}
                disabled={form.role === 'admin'}
                onChange={(e) => {
                  const has = e.target.checked
                  const rest = (form.permissions ?? []).filter((p) => p !== 'manageFields')
                  setForm({ ...form, permissions: has ? [...rest, 'manageFields' as PermissionKey] : rest })
                }}
                className="h-4 w-4"
              />
              Can manage entity fields
            </label>
            <p className="mt-1 text-[11px] text-slate-400">Admins and managers have this by role; grant it here to let cashiers/staff customize fields.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}