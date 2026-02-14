import { createFileRoute } from '@tanstack/react-router'
import { clearSessionCookie, sessionCookie } from '@/lib/session'

export const Route = createFileRoute('/api/session')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as
          | { apiKey?: string }
          | null

        const apiKey = body?.apiKey?.trim()
        if (!apiKey) {
          return Response.json({ error: 'API key is required' }, { status: 400 })
        }

        const secure = new URL(request.url).protocol === 'https:'

        return Response.json(
          { ok: true },
          {
            status: 200,
            headers: {
              'Set-Cookie': sessionCookie(apiKey, secure),
            },
          },
        )
      },
      DELETE: async ({ request }) => {
        const secure = new URL(request.url).protocol === 'https:'

        return Response.json(
          { ok: true },
          {
            status: 200,
            headers: {
              'Set-Cookie': clearSessionCookie(secure),
            },
          },
        )
      },
    },
  },
})
