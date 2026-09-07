import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Settings } from 'lucide-react'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function SettingsPage({ params }: Props) {
  await params

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres"
        description="Configurez les paramètres de votre projet."
      />

      <Card className="border-dashed">
        <EmptyState
          compact
          icon={Settings}
          title="Paramètres du projet"
          description="La configuration avancée du projet sera disponible prochainement."
        />
      </Card>
    </div>
  )
}
