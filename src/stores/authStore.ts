import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { mockLogin } from '../services/authService'

interface AuthState {
  user: User | null
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (username, password) => {
        const user = await mockLogin(username, password)
        set({ user })
        return user
      },
      logout: () => set({ user: null }),
    }),
    { name: 'multi-sector-erp-auth' },
  ),
)
