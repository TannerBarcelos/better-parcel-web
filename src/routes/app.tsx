import { createFileRoute } from '@tanstack/react-router'
import { ParcelDashboard } from '@/components/parcel-dashboard'

export type AppSearch = {
  mode: 'active' | 'recent'
  group: 'none' | 'carrier' | 'status'
  carrier?: string
  status?: string
}

export const Route = createFileRoute('/app')({
  validateSearch: (search): AppSearch => {
    const mode = search.mode === 'recent' ? 'recent' : 'active'
    const group =
      search.group === 'carrier' || search.group === 'status' ? search.group : 'none'
    const carrier = typeof search.carrier === 'string' ? search.carrier.trim() : ''
    const status = typeof search.status === 'string' ? search.status.trim() : ''

    return {
      mode,
      group,
      carrier: carrier || undefined,
      status: status || undefined,
    }
  },
  component: AppPage,
})

function AppPage() {
  return <ParcelDashboard />
}
