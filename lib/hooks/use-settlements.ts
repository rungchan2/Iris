import { useQuery } from '@tanstack/react-query'
import { getPhotographerSettlements } from '@/lib/actions/settlements'

/**
 * Query Keys Factory for Settlements
 */
export const settlementKeys = {
  all: ['settlements'] as const,
  photographer: (photographerId: string) => [...settlementKeys.all, 'photographer', photographerId] as const,
}

/**
 * Hook for fetching photographer settlements
 */
export function usePhotographerSettlements(photographerId?: string) {
  return useQuery({
    queryKey: settlementKeys.photographer(photographerId || ''),
    queryFn: async () => {
      if (!photographerId) return []

      const result = await getPhotographerSettlements(photographerId)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch settlements')
      }

      return result.data
    },
    enabled: !!photographerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
