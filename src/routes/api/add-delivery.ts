import { createFileRoute } from '@tanstack/react-router'
import { getParcelApiKey } from '@/lib/session'

type AddDeliveryRequest = {
  trackingNumber?: string
  carrierCode?: string
  title?: string
}

export const Route = createFileRoute('/api/add-delivery')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = getParcelApiKey(request)
        if (!apiKey) {
          return Response.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = (await request.json().catch(() => null)) as AddDeliveryRequest | null
        const trackingNumber = body?.trackingNumber?.trim()

        if (!trackingNumber) {
          return Response.json({ error: 'trackingNumber is required' }, { status: 400 })
        }

        const payload = {
          tracking_number: trackingNumber,
          carrier_code: body?.carrierCode?.trim() || null,
          title: body?.title?.trim() || null,
        }

        const parcelResponse = await fetch('https://api.parcel.app/external/add-delivery/', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await parcelResponse.json().catch(() => null)
        if (!parcelResponse.ok) {
          const error =
            typeof data === 'object' && data && 'error' in data
              ? String((data as { error: unknown }).error)
              : 'Failed to add delivery'

          return Response.json({ error }, { status: parcelResponse.status })
        }

        return Response.json(data, { status: 200 })
      },
    },
  },
})
