import { createFileRoute } from '@tanstack/react-router'
import { ParcelDashboard } from '@/components/parcel-dashboard'

export const Route = createFileRoute('/app')({
  component: AppPage,
})

function AppPage() {
  return <ParcelDashboard />
}
