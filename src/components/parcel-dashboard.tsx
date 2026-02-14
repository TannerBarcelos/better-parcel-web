import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

type Carrier = {
  code: string
  name: string
}

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
  name?: string
  description?: string
  tracking_number?: string
  status?: string
  status_code?: string | number
  carrier?:
    | {
        name?: string
        code?: string
      }
    | string
  carrier_code?: string
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

type CarriersResponse = {
  carriers: Carrier[]
}

type StatusMeta = {
  label: string
  className: string
  value: string
}

class UnauthorizedError extends Error {
  constructor() {
    super('Not authenticated')
    this.name = 'UnauthorizedError'
  }
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Completed',
  1: 'Frozen',
  2: 'In transit',
  3: 'Ready for pickup',
  4: 'Out for delivery',
  5: 'Not found',
  6: 'Delivery attempt failed',
  7: 'Exception',
  8: 'Info received',
}

const STATUS_CLASS_BY_CODE: Record<number, string> = {
  0: 'status-completed',
  1: 'status-frozen',
  2: 'status-in-transit',
  3: 'status-pickup',
  4: 'status-out-for-delivery',
  5: 'status-not-found',
  6: 'status-failed-attempt',
  7: 'status-exception',
  8: 'status-info-received',
}

function normalizeStatusText(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCode(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

function statusMeta(status?: string, statusCode?: string | number): StatusMeta {
  const numeric =
    typeof statusCode === 'number'
      ? statusCode
      : typeof statusCode === 'string' && /^\d+$/.test(statusCode.trim())
        ? Number(statusCode.trim())
        : null

  if (numeric != null && STATUS_LABELS[numeric]) {
    return {
      label: STATUS_LABELS[numeric],
      className: STATUS_CLASS_BY_CODE[numeric] ?? 'status-unknown',
      value: String(numeric),
    }
  }

  if (status && status.trim().length > 0) {
    const label = normalizeStatusText(status)
    return { label, className: 'status-unknown', value: label.toLowerCase() }
  }

  if (statusCode != null && String(statusCode).trim().length > 0) {
    const label = normalizeStatusText(String(statusCode))
    return { label, className: 'status-unknown', value: label.toLowerCase() }
  }

  return {
    label: 'Unknown',
    className: 'status-unknown',
    value: 'unknown',
  }
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

function resolveCarrierCode(delivery: Delivery): string {
  const raw = delivery as Record<string, unknown>

  if (typeof delivery.carrier === 'string') {
    return normalizeCode(delivery.carrier)
  }

  return (
    normalizeCode(delivery.carrier_code) ||
    normalizeCode(
      delivery.carrier && typeof delivery.carrier === 'object' ? delivery.carrier.code : undefined,
    ) ||
    normalizeCode(typeof raw.carrier_slug === 'string' ? raw.carrier_slug : undefined) ||
    normalizeCode(typeof raw.carrier_id === 'string' ? raw.carrier_id : undefined) ||
    normalizeCode(typeof raw.provider === 'string' ? raw.provider : undefined) ||
    normalizeCode(typeof raw.shipper === 'string' ? raw.shipper : undefined)
  )
}

function resolveCarrierName(
  delivery: Delivery,
  carrierNameByCode: Record<string, string>,
): string {
  if (delivery.carrier && typeof delivery.carrier === 'object' && delivery.carrier.name) {
    return delivery.carrier.name
  }

  const code = resolveCarrierCode(delivery)
  if (code && carrierNameByCode[code]) {
    return carrierNameByCode[code]
  }

  if (code) return code.toUpperCase()
  return 'Unknown'
}

function resolveDeliveryTitle(delivery: Delivery): string {
  const raw = delivery as Record<string, unknown>
  const candidates = [
    delivery.title,
    delivery.name,
    delivery.description,
    typeof raw.display_name === 'string' ? raw.display_name : undefined,
    typeof raw.item_name === 'string' ? raw.item_name : undefined,
    typeof raw.merchant === 'string' ? raw.merchant : undefined,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  if (delivery.tracking_number) {
    return `Package ${delivery.tracking_number}`
  }

  return 'Package'
}

type DecoratedDelivery = {
  delivery: Delivery
  carrierCode: string
  carrierName: string
  status: StatusMeta
}

async function fetchDeliveries(mode: 'active' | 'recent'): Promise<Delivery[]> {
  const response = await fetch(`/api/deliveries?filter_mode=${mode}`)

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(data?.error ?? 'Failed to load deliveries')
  }

  const data = (await response.json()) as DeliveriesResponse
  return Array.isArray(data.deliveries) ? data.deliveries : []
}

async function fetchCarriers(): Promise<Carrier[]> {
  const response = await fetch('/api/carriers')
  if (!response.ok) return []

  const data = (await response.json()) as CarriersResponse
  return Array.isArray(data.carriers) ? data.carriers : []
}

async function addDeliveryRequest(payload: {
  trackingNumber: string
  carrierCode: string
  title: string
}) {
  const response = await fetch('/api/add-delivery', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(data?.error ?? 'Failed to add delivery')
  }

  return response.json().catch(() => null)
}

export function ParcelDashboard() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/app' })
  const queryClient = useQueryClient()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrierCode, setCarrierCode] = useState('')
  const [title, setTitle] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const mode = search.mode
  const group = search.group
  const selectedCarrierFilter = search.carrier ?? ''
  const selectedStatusFilter = search.status ?? ''

  const deliveriesQuery = useQuery({
    queryKey: ['deliveries', mode],
    queryFn: () => fetchDeliveries(mode),
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  const carriersQuery = useQuery({
    queryKey: ['carriers'],
    queryFn: fetchCarriers,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  })

  const addDeliveryMutation = useMutation({
    mutationFn: addDeliveryRequest,
    onSuccess: async () => {
      setTrackingNumber('')
      setCarrierCode('')
      setTitle('')
      setIsAddModalOpen(false)

      await queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    },
  })

  useEffect(() => {
    if (deliveriesQuery.error instanceof UnauthorizedError) {
      navigate({ to: '/sign-in' })
    }
  }, [deliveriesQuery.error, navigate])

  useEffect(() => {
    if (addDeliveryMutation.error instanceof UnauthorizedError) {
      navigate({ to: '/sign-in' })
    }
  }, [addDeliveryMutation.error, navigate])

  useEffect(() => {
    if (!selectedDelivery?.tracking_number) return

    const refreshed = (deliveriesQuery.data ?? []).find(
      (item) => item.tracking_number === selectedDelivery.tracking_number,
    )

    if (refreshed) {
      setSelectedDelivery(refreshed)
    }
  }, [deliveriesQuery.data, selectedDelivery?.tracking_number])

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      if (selectedDelivery) {
        setSelectedDelivery(null)
        return
      }

      if (isAddModalOpen) {
        setIsAddModalOpen(false)
        return
      }

      if (isFilterPanelOpen) {
        setIsFilterPanelOpen(false)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [selectedDelivery, isAddModalOpen, isFilterPanelOpen])

  function patchSearch(
    patch: Partial<{
      mode: 'active' | 'recent'
      group: 'none' | 'carrier' | 'status'
      carrier: string
      status: string
    }>,
  ) {
    const nextMode = patch.mode ?? mode
    const nextGroup = patch.group ?? group
    const nextCarrier =
      patch.carrier !== undefined ? patch.carrier || undefined : selectedCarrierFilter || undefined
    const nextStatus =
      patch.status !== undefined ? patch.status || undefined : selectedStatusFilter || undefined

    navigate({
      to: '/app',
      search: {
        mode: nextMode,
        group: nextGroup,
        carrier: nextCarrier,
        status: nextStatus,
      },
      replace: true,
    })
  }

  const sortedDeliveries = useMemo(() => {
    const deliveries = deliveriesQuery.data ?? []

    return [...deliveries].sort((a, b) => {
      const aDate = a.date_expected ?? a.estimate?.arrival ?? ''
      const bDate = b.date_expected ?? b.estimate?.arrival ?? ''
      return bDate.localeCompare(aDate)
    })
  }, [deliveriesQuery.data])

  const carrierNameByCode = useMemo(() => {
    return (carriersQuery.data ?? []).reduce<Record<string, string>>((acc, carrier) => {
      acc[normalizeCode(carrier.code)] = carrier.name
      return acc
    }, {})
  }, [carriersQuery.data])

  const decoratedDeliveries = useMemo<DecoratedDelivery[]>(() => {
    return sortedDeliveries.map((delivery) => ({
      delivery,
      carrierCode: resolveCarrierCode(delivery),
      carrierName: resolveCarrierName(delivery, carrierNameByCode),
      status: statusMeta(delivery.status, delivery.status_code),
    }))
  }, [sortedDeliveries, carrierNameByCode])

  const carrierOptions = useMemo(() => {
    const carrierMap = new Map<string, string>()

    ;(carriersQuery.data ?? []).forEach((carrier) => {
      carrierMap.set(normalizeCode(carrier.code), carrier.name)
    })

    decoratedDeliveries.forEach((item) => {
      if (!item.carrierCode) return
      if (!carrierMap.has(item.carrierCode)) {
        carrierMap.set(item.carrierCode, item.carrierName)
      }
    })

    return Array.from(carrierMap.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [carriersQuery.data, decoratedDeliveries])

  const statusOptions = useMemo(() => {
    const statusMap = new Map<string, string>()

    decoratedDeliveries.forEach((item) => {
      statusMap.set(item.status.value, item.status.label)
    })

    return Array.from(statusMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [decoratedDeliveries])

  const filteredDeliveries = useMemo(() => {
    return decoratedDeliveries.filter((item) => {
      const carrierMatch = !selectedCarrierFilter || item.carrierCode === selectedCarrierFilter
      const statusMatch = !selectedStatusFilter || item.status.value === selectedStatusFilter

      return carrierMatch && statusMatch
    })
  }, [decoratedDeliveries, selectedCarrierFilter, selectedStatusFilter])

  const groupedDeliveries = useMemo(() => {
    if (group === 'none') return []

    const grouped = new Map<string, { title: string; items: DecoratedDelivery[] }>()

    filteredDeliveries.forEach((item) => {
      const key = group === 'carrier' ? item.carrierCode || 'unknown' : item.status.value
      const groupTitle = group === 'carrier' ? item.carrierName : item.status.label

      const existing = grouped.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        grouped.set(key, { title: groupTitle, items: [item] })
      }
    })

    return Array.from(grouped.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [filteredDeliveries, group])

  const currentLocation = useMemo(
    () => getCurrentLocation(selectedDelivery),
    [selectedDelivery],
  )

  const selectedStatus = useMemo(
    () =>
      selectedDelivery
        ? statusMeta(selectedDelivery.status, selectedDelivery.status_code)
        : null,
    [selectedDelivery],
  )
  const activeFilterCount =
    (group !== 'none' ? 1 : 0) +
    (selectedCarrierFilter ? 1 : 0) +
    (selectedStatusFilter ? 1 : 0)

  const loading = deliveriesQuery.isPending
  const error =
    deliveriesQuery.error instanceof Error &&
    !(deliveriesQuery.error instanceof UnauthorizedError)
      ? deliveriesQuery.error.message
      : addDeliveryMutation.error instanceof Error &&
          !(addDeliveryMutation.error instanceof UnauthorizedError)
        ? addDeliveryMutation.error.message
        : null

  function onAddDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    addDeliveryMutation.mutate({
      trackingNumber,
      carrierCode,
      title,
    })
  }

  async function onSignOut() {
    await fetch('/api/session', { method: 'DELETE' })
    await navigate({ to: '/sign-in' })
  }

  function renderDeliveryCard(item: DecoratedDelivery) {
    const delivery = item.delivery
    const key = delivery.id ?? delivery.tracking_number ?? `${item.carrierCode}-${item.status.value}`
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
          <p className="delivery-title">{resolveDeliveryTitle(delivery)}</p>
          <p>
            <strong>Tracking:</strong> {delivery.tracking_number ?? 'Unknown'}
          </p>
          <p>
            <strong>Carrier:</strong> {item.carrierName}
          </p>
          <p>
            <strong>ETA:</strong> {formatDate(delivery.date_expected ?? delivery.estimate?.arrival)}
          </p>
          <span className={`status-pill ${item.status.className}`}>{item.status.label}</span>
        </button>
      </li>
    )
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
          <div className="list-controls">
            <div className="segmented">
              <button
                type="button"
                className={mode === 'active' ? 'button tiny primary' : 'button tiny ghost'}
                onClick={() => patchSearch({ mode: 'active' })}
              >
                Active
              </button>
              <button
                type="button"
                className={mode === 'recent' ? 'button tiny primary' : 'button tiny ghost'}
                onClick={() => patchSearch({ mode: 'recent' })}
              >
                Recent
              </button>
            </div>
            <button
              type="button"
              className="button tiny ghost filter-trigger"
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              aria-expanded={isFilterPanelOpen}
              aria-label="Open grouping and filtering options"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="filter-icon">
                <path d="M3 5h18l-7 8v5l-4 1v-6L3 5z" fill="currentColor" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="filter-count">{activeFilterCount}</span>
              ) : null}
            </button>
          </div>
        </div>

        {isFilterPanelOpen ? (
          <div className="filter-panel">
            <div className="filter-panel-head">
              <p>Delivery filters</p>
              <button
                type="button"
                className="button tiny ghost"
                onClick={() => patchSearch({ group: 'none', carrier: '', status: '' })}
              >
                Clear all
              </button>
            </div>

            <div className="filter-field">
              <label>Group by</label>
              <div className="group-toggle">
                <button
                  type="button"
                  className={group === 'none' ? 'button tiny primary' : 'button tiny ghost'}
                  onClick={() => patchSearch({ group: 'none' })}
                >
                  None
                </button>
                <button
                  type="button"
                  className={group === 'carrier' ? 'button tiny primary' : 'button tiny ghost'}
                  onClick={() => patchSearch({ group: 'carrier' })}
                >
                  Carrier
                </button>
                <button
                  type="button"
                  className={group === 'status' ? 'button tiny primary' : 'button tiny ghost'}
                  onClick={() => patchSearch({ group: 'status' })}
                >
                  Status
                </button>
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="carrier-filter">Carrier</label>
              <select
                id="carrier-filter"
                value={selectedCarrierFilter}
                onChange={(event) => patchSearch({ carrier: event.target.value })}
              >
                <option value="">All carriers</option>
                {carrierOptions.map((carrier) => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={selectedStatusFilter}
                onChange={(event) => patchSearch({ status: event.target.value })}
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p>Loading deliveries...</p> : null}

        {!loading && filteredDeliveries.length === 0 ? (
          <p>No deliveries found with the current filters.</p>
        ) : null}

        {!loading && filteredDeliveries.length > 0 && group === 'none' ? (
          <ul className="delivery-list">{filteredDeliveries.map((item) => renderDeliveryCard(item))}</ul>
        ) : null}

        {!loading && filteredDeliveries.length > 0 && group !== 'none' ? (
          <div className="grouped-deliveries">
            {groupedDeliveries.map((bucket) => (
              <section key={bucket.title} className="delivery-group">
                <div className="delivery-group-header">
                  <h3>{bucket.title}</h3>
                  <p>{bucket.items.length} shipments</p>
                </div>
                <ul className="delivery-list">{bucket.items.map((item) => renderDeliveryCard(item))}</ul>
              </section>
            ))}
          </div>
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

              <label htmlFor="carrier-code">Carrier</label>
              <select
                id="carrier-code"
                value={carrierCode}
                onChange={(event) => setCarrierCode(event.target.value)}
              >
                <option value="">Auto-detect carrier</option>
                {(carriersQuery.data ?? []).map((carrier) => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name} ({carrier.code})
                  </option>
                ))}
              </select>

              <label htmlFor="delivery-title">Title (optional)</label>
              <input
                id="delivery-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="New monitor"
              />

              <button className="button primary" type="submit" disabled={addDeliveryMutation.isPending}>
                {addDeliveryMutation.isPending ? 'Adding...' : 'Add delivery'}
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
                <h2>{resolveDeliveryTitle(selectedDelivery)}</h2>
                <p>
                  <strong>Tracking number:</strong> {selectedDelivery.tracking_number ?? 'Unknown'}
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
                  <span className={`status-pill ${selectedStatus?.className ?? 'status-unknown'}`}>
                    {selectedStatus?.label ?? 'Unknown'}
                  </span>
                </p>
                <p>
                  <strong>Carrier:</strong> {resolveCarrierName(selectedDelivery, carrierNameByCode)}
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
                      .map((event, eventIndex) => {
                        const eventLocation = getEventLocation(event)

                        return (
                          <li key={`${event.date ?? 'event'}-${eventIndex}`}>
                            <p className="event-title">{event.event ?? 'Update'}</p>
                            <p>{formatDate(event.date)}</p>
                            {eventLocation ? <p>{eventLocation}</p> : null}
                            {event.details ? <p>{event.details}</p> : null}
                          </li>
                        )
                      })}
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
