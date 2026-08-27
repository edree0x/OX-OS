import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  listAll,
} from '../services/entityService'
import type { ListParams } from '../services/entityService'

export function useEntityList(entityId: string, params: ListParams) {
  return useQuery({
    queryKey: ['entity', entityId, params],
    queryFn: () => listEntities(entityId, params),
  })
}

export function useEntityRecord(entityId: string, id: string) {
  return useQuery({
    queryKey: ['entity', entityId, id],
    queryFn: () => getEntity(entityId, id),
    enabled: !!id,
  })
}

export function useEntityMutations(entityId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['entity', entityId] })

  const create = useMutation({ mutationFn: (data: Record<string, unknown>) => createEntity(entityId, data), onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateEntity(entityId, id, data),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: string) => deleteEntity(entityId, id), onSuccess: invalidate })

  return { create, update, remove }
}

export function useEntityAll(entityId: string) {
  return useQuery({
    queryKey: ['entity-all', entityId],
    queryFn: () => listAll(entityId),
  })
}
