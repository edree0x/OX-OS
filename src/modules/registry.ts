import type { AppConfig, ModuleDef } from '../types'

const dashboardModule: ModuleDef = {
  id: 'dashboard',
  kind: 'dashboard',
  name: 'Dashboard',
  icon: 'home',
  path: '/dashboard',
  permission: null,
}

const reportsModule: ModuleDef = {
  id: 'reports',
  kind: 'reports',
  name: 'Reports',
  icon: 'chart',
  path: '/reports',
  permission: null,
}

const settingsModule: ModuleDef = {
  id: 'settings',
  kind: 'settings',
  name: 'Settings',
  icon: 'settings',
  path: '/settings',
  permission: 'admin',
}

const rbacModule: ModuleDef = {
  id: 'rbac',
  kind: 'rbac',
  name: 'User Management',
  icon: 'users',
  path: '/users',
  permission: 'admin',
}

function entityModule(e: AppConfig['entities'][number]): ModuleDef {
  return {
    id: e.id,
    kind: 'entity',
    name: e.pluralName,
    icon: e.icon,
    path: '/entity/' + e.id,
    permission: null,
    entityId: e.id,
  }
}

export function getActiveModules(config: AppConfig): ModuleDef[] {
  const modules: ModuleDef[] = [dashboardModule]
  config.entities.forEach((e) => modules.push(entityModule(e)))

  if (config.features.pos && config.posEntityId) {
    modules.push({
      id: 'pos',
      kind: 'pos',
      name: 'POS & Billing',
      icon: 'cart',
      path: '/pos',
      permission: null,
    })
  }
  if (config.tableMap) {
    modules.push({
      id: 'tablemap',
      kind: 'tablemap',
      name: config.tableMap.label + ' Map',
      icon: 'layout',
      path: '/floor',
      permission: null,
    })
  }
  if (config.calendarEntityId) {
    modules.push({
      id: 'calendar',
      kind: 'calendar',
      name: 'Calendar',
      icon: 'calendar',
      path: '/calendar',
      permission: null,
      entityId: config.calendarEntityId,
    })
  }
  if (config.kanbanEntityId) {
    modules.push({
      id: 'kanban',
      kind: 'kanban',
      name: 'Ticket Board',
      icon: 'kanban',
      path: '/board',
      permission: null,
      entityId: config.kanbanEntityId,
    })
  }
  if (config.features.reports) modules.push(reportsModule)
  if (config.features.rbac) modules.push(rbacModule)
  modules.push(settingsModule)
  return modules
}
