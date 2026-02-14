import { createFileRoute } from '@tanstack/react-router'
import { getParcelApiKey } from '@/lib/session'

type AddDeliveryRequest = {
  trackingNumber?: string
  carrierCode?: string
  title?: string
}

function userMessageForStatus(status: number): string {
  if (status === 429) {
    return 'Too many requests right now. Please wait a moment and try again.'
  }
  if (status === 400) {
    return 'We could not add this delivery. Please check the tracking details and try again.'
  }
  if (status === 404) {
    return 'We could not find that shipment with the provided details.'
  }
  if (status >= 500) {
    return 'Parcel is temporarily unavailable. Please try again soon.'
  }

  return 'Unable to add delivery right now. Please try again.'
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
          const error = userMessageForStatus(parcelResponse.status)

          return Response.json({ error }, { status: parcelResponse.status })
        }

        return Response.json(data, { status: 200 })
      },
    },
  },
})
