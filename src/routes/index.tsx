import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="shell">
      <section className="hero card">
        <div className="hero-grid">
          <div>
            <p className="kicker">A Better Parcel Web Experience</p>
            <h1>Modern shipment tracking with detail-first design.</h1>
            <p>
              Connect your Parcel account, view every delivery in one responsive dashboard,
              and jump into event timelines with map-based location context.
            </p>
            <div className="hero-actions">
              <Link to="/sign-in" className="button primary">
                Sign in with Parcel API key
              </Link>
              <a
                href="https://parcel.app/help/api.html"
                target="_blank"
                rel="noreferrer"
                className="button ghost"
              >
                API documentation
              </a>
            </div>
          </div>

          <div className="hero-panel">
            <p className="hero-panel-title">What you get</p>
            <ul>
              <li>Delivery overview with Active and Recent filters</li>
              <li>Shipment detail pages with event timeline and map view</li>
              <li>Quick add for new tracking numbers</li>
              <li>Fast, mobile-ready dark UI</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="card feature-card">
          <h2>Delivery dashboard</h2>
          <p>
            Keep all shipments in one place with status highlights and expected arrival
            timestamps.
          </p>
        </article>

        <article className="card feature-card">
          <h2>Detail views with map</h2>
          <p>
            Open a delivery and inspect its tracking timeline, including the latest location on
            an embedded map when carrier events include location data.
          </p>
        </article>

        <article className="card feature-card">
          <h2>Private API key handling</h2>
          <p>
            Your API key is stored in an HTTP-only cookie and used only via server routes,
            keeping it out of browser JavaScript.
          </p>
        </article>
      </section>
    </main>
  )
}
