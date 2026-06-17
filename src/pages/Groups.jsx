import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { Users } from 'lucide-react'

export default function Groups() {
  return (
    <>
      <TopBar title="Groups" back />
      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Groups" subtitle="Manage your shared groups and friends" />
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group to share expenses with others"
        />
      </div>
    </>
  )
}
