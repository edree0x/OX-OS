import { Outlet } from 'react-router-dom'
import { useIsFetching } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from '../ErrorBoundary'
import { Toaster } from '../ui/Toast'
import { useAutoBackup } from '../../hooks/useAutoBackup'
import { useAppConfig } from '../../hooks/useAppConfig'

export default function Layout() {
  const fetching = useIsFetching()
  const config = useAppConfig()
  useAutoBackup(!!config)
  return (
    <div className="flex h-full bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {fetching > 0 && (
        <div className="fixed left-0 right-0 top-0 z-[110] h-1 overflow-hidden bg-indigo-100">
          <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-indigo-600" />
        </div>
      )}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
