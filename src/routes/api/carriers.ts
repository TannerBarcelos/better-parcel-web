import { createFileRoute } from '@tanstack/react-router'

type SupportedCarrier = {
  code?: string
  name?: string
}

type CarriersResponse = {
  carriers: Array<{ code: string; name: string }>
}

export const Route = createFileRoute('/api/carriers')({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(
          'https://api.parcel.app/external/supported_carriers.json',
          {
            method: 'GET',
          },
        )

        const data = (await response.json().catch(() => null)) as
          | Record<string, string>
          | SupportedCarrier[]
          | null

        if (!response.ok || data == null) {
          return Response.json(
            { error: 'Failed to load carriers' },
            { status: response.ok ? 502 : response.status },
          )
        }

        const carriers = Array.isArray(data)
          ? data
              .map((carrier) => ({
                code: carrier.code?.trim().toLowerCase() ?? '',
                name: carrier.name?.trim() ?? '',
              }))
              .filter((carrier) => carrier.code.length > 0 && carrier.name.length > 0)
          : Object.entries(data)
              .map(([code, name]) => ({
                code: code.trim().toLowerCase(),
                name: String(name).trim(),
              }))
              .filter((carrier) => carrier.code.length > 0 && carrier.name.length > 0)

        carriers.sort((a, b) => a.name.localeCompare(b.name))

        const payload: CarriersResponse = { carriers }

        return Response.json(payload, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=86400',
          },
        })
      },
    },
  },
})
