import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
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
        <HeadContent />
      </head>
      <body>
        <Outlet />
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
