import { ShoppingCart } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'

export default function Finance() {
  return (
    <>
      <TopBar title="Finance" />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Finance" subtitle="Orders, spending and splits" />
        <EmptyState
          icon={ShoppingCart}
          title="No orders yet"
          description="Your shopping trips and spending history will appear here"
        />
      </div>
    </>
  )
}
