import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { Package } from 'lucide-react'

export default function Inventory() {
  return (
    <>
      <TopBar title="Inventory" />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Inventory" subtitle="Track your stock levels" />
        <EmptyState
          icon={Package}
          title="Nothing in stock"
          description="Stock levels will appear here"
        />
      </div>
    </>
  )
}
