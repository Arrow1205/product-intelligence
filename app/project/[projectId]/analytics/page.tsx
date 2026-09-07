import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart2 } from 'lucide-react'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function AnalyticsPage({ params }: Props) {
  await params

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Visualisez les métriques clés de votre produit issus de vos sources de données connectées."
      />

      <Card className="border-dashed">
        <EmptyState
          compact
          icon={BarChart2}
          title="Aucune donnée Analytics disponible"
          description="Connectez GA4 ou importez un fichier CSV/XLSX depuis Data Sources pour visualiser vos métriques ici."
        />
      </Card>
    </div>
  )
}
