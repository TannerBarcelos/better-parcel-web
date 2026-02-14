import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import '../styles.css'

export type RouterAppContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Better Parcel Web</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundPage() {
  return (
    <main className="shell">
      <section className="card auth-card">
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link to="/" className="button primary">
          Go to home
        </Link>
      </section>
    </main>
  )
}
