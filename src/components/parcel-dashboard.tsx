import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

type DeliveryEvent = {
  event?: string
  location?: unknown
  date?: string
  details?: string
  city?: string
  state?: string
  country?: string
  [key: string]: unknown
}

type Delivery = {
  id?: string
  title?: string
  tracking_number?: string
  status?: string
  status_code?: string | number
  carrier?: {
    name?: string
  }
  estimate?: {
    arrival?: string
  }
  date_expected?: string
  events?: DeliveryEvent[]
  location?: unknown
  [key: string]: unknown
}

type DeliveriesResponse = {
  deliveries: Delivery[]
}

function statusText(status?: string, statusCode?: string | number) {
  if (status) return status
  if (statusCode != null) return String(statusCode)
  return 'Unknown'
}

function formatDate(value?: string) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function getEventLocation(event: DeliveryEvent): string | null {
  if (typeof event.location === 'string' && event.location.trim()) {
    return event.location.trim()
  }

  if (event.location && typeof event.location === 'object') {
    const locationObj = event.location as Record<string, unknown>
    const fromName = locationObj.name
    const fromDisplay = locationObj.display_name

    if (typeof fromName === 'string' && fromName.trim()) {
      return fromName.trim()
    }

    if (typeof fromDisplay === 'string' && fromDisplay.trim()) {
      return fromDisplay.trim()
    }

    const parts = [locationObj.city, locationObj.state, locationObj.country]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map((part) => part.trim())

    if (parts.length > 0) {
      return parts.join(', ')
    }
  }

  const parts = [event.city, event.state, event.country]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())

  if (parts.length > 0) {
    return parts.join(', ')
  }

  return null
}

function getCurrentLocation(delivery: Delivery | null): string | null {
  if (!delivery) return null

  const events = delivery.events ?? []
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const location = getEventLocation(events[index])
    if (location) return location
  }

  if (typeof delivery.location === 'string' && delivery.location.trim()) {
    return delivery.location.trim()
  }

  return null
}

export function ParcelDashboard() {
  const navigate = useNavigate()
  const [filterMode, setFilterMode] = useState<'active' | 'recent'>('active')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrierCode, setCarrierCode] = useState('')
  const [title, setTitle] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  async function loadDeliveries(mode: 'active' | 'recent') {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deliveries?filter_mode=${mode}`)
      if (response.status === 401) {
        await navigate({ to: '/sign-in' })
        return
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? 'Failed to load deliveries')
      }

      const data = (await response.json()) as DeliveriesResponse
      setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries(filterMode)
  }, [filterMode])

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      if (selectedDelivery) {
        setSelectedDelivery(null)
        return
      }

      if (isAddModalOpen) {
        setIsAddModalOpen(false)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [selectedDelivery, isAddModalOpen])

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      const aDate = a.date_expected ?? a.estimate?.arrival ?? ''
      const bDate = b.date_expected ?? b.estimate?.arrival ?? ''
      return bDate.localeCompare(aDate)
    })
  }, [deliveries])

  const currentLocation = useMemo(
    () => getCurrentLocation(selectedDelivery),
    [selectedDelivery],
  )

  async function onAddDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setAdding(true)

    try {
      const response = await fetch('/api/add-delivery', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber,
          carrierCode,
          title,
        }),
      })

      if (response.status === 401) {
        await navigate({ to: '/sign-in' })
        return
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(data?.error ?? 'Failed to add delivery')
      }

      setTrackingNumber('')
      setCarrierCode('')
      setTitle('')
      setIsAddModalOpen(false)
      await loadDeliveries(filterMode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add delivery')
    } finally {
      setAdding(false)
    }
  }

  async function onSignOut() {
    await fetch('/api/session', { method: 'DELETE' })
    await navigate({ to: '/sign-in' })
  }

  return (
    <main className="shell app-layout">
      <section className="card app-header">
        <div>
          <p className="kicker">Dashboard</p>
          <h1>Your Parcel deliveries</h1>
          <p>Track active shipments, inspect details, and add new tracking numbers.</p>
        </div>
        <div className="app-header-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add delivery
          </button>
          <button className="button ghost" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </section>

      <section className="card">
        <div className="list-header">
          <h2>All deliveries</h2>
          <div className="segmented">
            <button
              type="button"
              className={filterMode === 'active' ? 'button tiny primary' : 'button tiny ghost'}
              onClick={() => setFilterMode('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={filterMode === 'recent' ? 'button tiny primary' : 'button tiny ghost'}
              onClick={() => setFilterMode('recent')}
            >
              Recent
            </button>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p>Loading deliveries...</p> : null}

        {!loading && sortedDeliveries.length === 0 ? (
          <p>No deliveries found for this filter.</p>
        ) : null}

        {!loading && sortedDeliveries.length > 0 ? (
          <ul className="delivery-list">
            {sortedDeliveries.map((delivery, index) => {
              const key = delivery.id ?? `${delivery.tracking_number ?? 'unknown'}-${index}`
              const status = statusText(delivery.status, delivery.status_code)
              const isSelected =
                selectedDelivery?.tracking_number != null &&
                delivery.tracking_number === selectedDelivery.tracking_number

              return (
                <li key={key} className={isSelected ? 'delivery-item selected' : 'delivery-item'}>
                  <button
                    type="button"
                    className="delivery-link"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <p className="delivery-title">{delivery.title ?? 'Untitled delivery'}</p>
                    <p>
                      <strong>Tracking:</strong> {delivery.tracking_number ?? 'Unknown'}
                    </p>
                    <p>
                      <strong>Carrier:</strong> {delivery.carrier?.name ?? 'Unknown'}
                    </p>
                    <p>
                      <strong>ETA:</strong>{' '}
                      {formatDate(delivery.date_expected ?? delivery.estimate?.arrival)}
                    </p>
                    <span className="status-pill">{status}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>

      {isAddModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsAddModalOpen(false)}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Add delivery"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add delivery</h2>
              <button
                type="button"
                className="button ghost tiny"
                onClick={() => setIsAddModalOpen(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={onAddDelivery} className="stack">
              <label htmlFor="tracking-number">Tracking number</label>
              <input
                id="tracking-number"
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="1Z999AA10123456784"
                required
              />

              <label htmlFor="carrier-code">Carrier code (optional)</label>
              <input
                id="carrier-code"
                value={carrierCode}
                onChange={(event) => setCarrierCode(event.target.value)}
                placeholder="ups"
              />

              <label htmlFor="delivery-title">Title (optional)</label>
              <input
                id="delivery-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="New monitor"
              />

              <button className="button primary" type="submit" disabled={adding}>
                {adding ? 'Adding...' : 'Add delivery'}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {selectedDelivery ? (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedDelivery(null)}>
          <section
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Delivery details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{selectedDelivery.title ?? 'Delivery details'}</h2>
                <p>
                  <strong>Tracking number:</strong>{' '}
                  {selectedDelivery.tracking_number ?? 'Unknown'}
                </p>
              </div>
              <button
                type="button"
                className="button ghost tiny"
                onClick={() => setSelectedDelivery(null)}
              >
                Close
              </button>
            </div>

            <div className="details-grid">
              <div>
                <p>
                  <strong>Status:</strong>{' '}
                  {statusText(selectedDelivery.status, selectedDelivery.status_code)}
                </p>
                <p>
                  <strong>Carrier:</strong> {selectedDelivery.carrier?.name ?? 'Unknown'}
                </p>
                <p>
                  <strong>Expected arrival:</strong>{' '}
                  {formatDate(
                    selectedDelivery.date_expected ?? selectedDelivery.estimate?.arrival,
                  )}
                </p>
              </div>

              <div>
                <h3>Current location</h3>
                {currentLocation ? (
                  <>
                    <p>{currentLocation}</p>
                    <iframe
                      title="Delivery location map"
                      className="map-frame"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(currentLocation)}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </>
                ) : (
                  <p>No location is available from carrier updates yet.</p>
                )}
              </div>

              <div className="events-col">
                <h3>Tracking events</h3>
                {selectedDelivery.events && selectedDelivery.events.length > 0 ? (
                  <ul className="events-list">
                    {selectedDelivery.events
                      .slice()
                      .reverse()
                      .map((event, eventIndex) => (
                        <li key={`${event.date ?? 'event'}-${eventIndex}`}>
                          <p className="event-title">{event.event ?? 'Update'}</p>
                          <p>{formatDate(event.date)}</p>
                          {getEventLocation(event) ? <p>{getEventLocation(event)}</p> : null}
                          {event.details ? <p>{event.details}</p> : null}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No timeline events available for this shipment.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
