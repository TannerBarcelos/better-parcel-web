import { createFileRoute } from '@tanstack/react-router'
import { getParcelApiKey } from '@/lib/session'

type FilterMode = 'active' | 'recent'

function normalizeFilterMode(input: string | null): FilterMode {
  return input === 'recent' ? 'recent' : 'active'
}

export const Route = createFileRoute('/api/deliveries')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = getParcelApiKey(request)
        if (!apiKey) {
          return Response.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const url = new URL(request.url)
        const filterMode = normalizeFilterMode(url.searchParams.get('filter_mode'))

        const parcelResponse = await fetch(
          `https://api.parcel.app/external/deliveries/?filter_mode=${filterMode}`,
          {
            method: 'GET',
            headers: {
              'api-key': apiKey,
            },
          },
        )

        const data = await parcelResponse.json().catch(() => null)
        if (!parcelResponse.ok) {
          const error =
            typeof data === 'object' && data && 'error' in data
              ? String((data as { error: unknown }).error)
              : 'Failed to fetch deliveries from Parcel API'

          return Response.json({ error }, { status: parcelResponse.status })
        }

        return Response.json(data, { status: 200 })
      },
    },
  },
})
