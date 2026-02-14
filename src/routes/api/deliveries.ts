import { createFileRoute } from '@tanstack/react-router'
import { getParcelApiKey } from '@/lib/session'

type FilterMode = 'active' | 'recent'

function normalizeFilterMode(input: string | null): FilterMode {
  return input === 'recent' ? 'recent' : 'active'
}

function userMessageForStatus(status: number): string {
  if (status === 429) {
    return 'Too many requests right now. Please wait a moment and try again.'
  }
  if (status === 400) {
    return 'We could not load deliveries with the selected options. Please try again.'
  }
  if (status >= 500) {
    return 'Parcel is temporarily unavailable. Please try again soon.'
  }

  return 'Unable to load deliveries right now. Please try again.'
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
          const error = userMessageForStatus(parcelResponse.status)

          return Response.json({ error }, { status: parcelResponse.status })
        }

        return Response.json(data, { status: 200 })
      },
    },
  },
})
