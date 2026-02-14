import { FormEvent, useState } from 'react'
import { Link, useNavigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? 'Unable to sign in')
      }

      await navigate({ to: '/app' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shell">
      <section className="card auth-card">
        <h1>Sign in</h1>
        <p>
          Use your Parcel API key from{' '}
          <a href="https://web.parcelapp.net" target="_blank" rel="noreferrer">
            web.parcelapp.net
          </a>
          .
        </p>

        <form onSubmit={onSubmit} className="stack" autoComplete="off">
          <label htmlFor="api-key">Parcel API key</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="pk_live_..."
            autoComplete="off"
            spellCheck={false}
            required
          />
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Continue'}
          </button>
          <blockquote className="callout-quote">
            <p>
              “Need an API key? Sign in at{' '}
              <a href="https://web.parcelapp.net" target="_blank" rel="noreferrer">
                web.parcelapp.net
              </a>
              , then open Settings and create or copy your API key from the API section.”
            </p>
          </blockquote>
          {error ? <p className="error">{error}</p> : null}
        </form>

        <Link to="/" className="text-link">
          Back to landing page
        </Link>
      </section>
    </main>
  )
}
