import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="shell landing-shell">
      <section className="hero card landing-section">
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

      <section className="feature-grid landing-section">
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

      <section className="card landing-section workflow-grid">
        <article className="workflow-step">
          <p className="kicker">Step 01</p>
          <h3>Sign in with your Parcel API key</h3>
          <p>
            Secure sign in with HTTP-only session cookies. Your key is never exposed in browser
            JavaScript.
          </p>
        </article>
        <article className="workflow-step">
          <p className="kicker">Step 02</p>
          <h3>Browse every shipment instantly</h3>
          <p>
            See active and recent deliveries with status tags, clean metadata, and fast filtering.
          </p>
        </article>
        <article className="workflow-step">
          <p className="kicker">Step 03</p>
          <h3>Open detail modal with map + timeline</h3>
          <p>
            Click any delivery to inspect status events and last-known location in a map overlay.
          </p>
        </article>
      </section>

      <section className="card landing-section cta-block">
        <h2>Ready to manage your packages with a cleaner interface?</h2>
        <p>
          Start with your Parcel API key and get a sharper, more focused web dashboard immediately.
        </p>
        <div className="hero-actions">
          <Link to="/sign-in" className="button primary">
            Open Dashboard
          </Link>
          <a
            href="https://parcel.app/help/api.html"
            target="_blank"
            rel="noreferrer"
            className="button ghost"
          >
            Read API docs
          </a>
        </div>
      </section>
    </main>
  )
}
