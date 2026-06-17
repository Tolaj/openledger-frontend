import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { ShoppingCart } from 'lucide-react'

export default function Orders() {
  return (
    <>
      <TopBar title="Orders" />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Orders" subtitle="Your shopping trips" />
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Your shopping trips will appear here"
        />
      </div>
    </>
  )
}
