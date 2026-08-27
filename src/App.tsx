import { useEffect, useRef } from 'react'
import AppRoutes from './app/router'
import { useAppConfig } from './hooks/useAppConfig'
import { seedForConfig } from './services/seedService'

export default function App() {
  const config = useAppConfig()
  const seeded = useRef(false)

  useEffect(() => {
    if (config && !seeded.current) {
      seeded.current = true
      const flag = `seeded:${config.sector}:${config.appName}`
      if (!localStorage.getItem(flag)) {
        seedForConfig(config).then(() => localStorage.setItem(flag, '1'))
      }
    } else if (!config) {
      seeded.current = false
    }
  }, [config])

  return <AppRoutes />
}
