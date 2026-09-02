import type { DataSource } from './dataSource'

const DB_NAME = 'multi-sector-erp'
const DB_VERSION = 2
const STORE = 'records'
const COLLECTION_INDEX = 'by_collection'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
      const store = req.transaction!.objectStore(STORE)
      // Create the __collection index (v2). If it exists already this is a no-op.
      if (!store.indexNames.contains(COLLECTION_INDEX)) {
        store.createIndex(COLLECTION_INDEX, '__collection', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function normalize(record: Record<string, unknown>, collection: string): Record<string, unknown> {
  return { ...record, __collection: collection }
}

function denormalize(record: Record<string, unknown>): Record<string, unknown> {
  const { __collection: _c, ...rest } = record
  return rest
}

/**
 * All collections currently present. Uses the __collection index range — a
 * single tree walk rather than scanning every row in JS.
 */
async function listCollections(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    if (!store.indexNames.contains(COLLECTION_INDEX)) {
      // Old/legacy schema without the index — fall back to scanning.
      const req = store.getAll()
      req.onsuccess = () => {
        const seen = new Set<string>()
        for (const r of req.result as Record<string, unknown>[]) {
          const c = r.__collection as string | undefined
          if (c) seen.add(c)
        }
        resolve(Array.from(seen))
      }
      req.onerror = () => reject(req.error)
      return
    }
    const index = store.index(COLLECTION_INDEX)
    const keys: unknown[] = []
    const cascReq = index.openKeyCursor()
    cascReq.onsuccess = () => {
      const cursor = cascReq.result
      if (cursor) {
        keys.push(cursor.primaryKey)
        cursor.continue()
      } else {
        resolve(Array.from(new Set(keys.map(String))))
      }
    }
    cascReq.onerror = () => reject(cascReq.error)
  })
}

export const indexDbDataSource: DataSource = {
  async getAll(collection) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      if (store.indexNames.contains(COLLECTION_INDEX)) {
        const index = store.index(COLLECTION_INDEX)
        const req = index.getAll(IDBKeyRange.only(collection))
        req.onsuccess = () =>
          resolve((req.result as Record<string, unknown>[]).map(denormalize))
        req.onerror = () => reject(req.error)
      } else {
        const req = store.getAll()
        req.onsuccess = () =>
          resolve(
            (req.result as Record<string, unknown>[]).filter(
              (r) => r.__collection === collection,
            ),
          )
        req.onerror = () => reject(req.error)
      }
    })
  },

  async get(collection, id) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => {
        const r = req.result as Record<string, unknown> | undefined
        resolve(r && r.__collection === collection ? denormalize(r) : null)
      }
      req.onerror = () => reject(req.error)
    })
  },

  async put(collection, record) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(normalize(record, collection))
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error)
    })
  },

  async delete(collection, id) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error)
    })
  },

  async listCollections() {
    const db = await openDB()
    return listCollections(db)
  },

  async allRecords() {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve(req.result as Record<string, unknown>[])
      req.onerror = () => reject(req.error)
    })
  },

  async importRecords(records) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      for (const record of records) {
        store.put(record)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  async wipe() {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },
}

// ---- Legacy named-export compatibility layer ---------------------------------
// Existing services called `db.dbGetAll(...)` etc. These thin wrappers delegate
// to the single DataSource so behaviour is identical while we migrate callers
// onto `indexDbDataSource` (or a shared DataSource singleton in future).

export async function dbGetAll(collection: string): Promise<Record<string, unknown>[]> {
  return indexDbDataSource.getAll(collection)
}

export async function dbGet(
  collection: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  return indexDbDataSource.get(collection, id)
}

export async function dbPut(
  collection: string,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return indexDbDataSource.put(collection, record)
}

export async function dbDelete(collection: string, id: string): Promise<boolean> {
  return indexDbDataSource.delete(collection, id)
}

export async function wipeDatabase(): Promise<void> {
  return indexDbDataSource.wipe()
}
