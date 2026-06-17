import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { Heart } from 'lucide-react'

export default function Wishlist() {
  return (
    <>
      <TopBar title="Wishlist" />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Wishlist" subtitle="Items you want to buy later" />
        <EmptyState
          icon={Heart}
          title="Wishlist is empty"
          description="Save items you want to buy later"
        />
      </div>
    </>
  )
}
