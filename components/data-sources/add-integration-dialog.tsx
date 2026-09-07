'use client'

import { useState } from 'react'
import { BarChart2, Activity, FileText, FileSpreadsheet, PenLine, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Select, Label, FieldError } from '@/components/ui/input'
import { HelpTooltip } from '@/components/ui/tooltip'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { ProjectIntegration, IntegrationProvider } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onAdded: (integration: ProjectIntegration) => void
}

type Step = 'pick' | 'configure'

const PROVIDERS = [
  {
    id: 'ga4' as IntegrationProvider,
    icon: BarChart2,
    name: 'Google Analytics 4',
    description: 'Sessions, events, conversions, acquisition, behaviour',
  },
  {
    id: 'hotjar' as IntegrationProvider,
    icon: Activity,
    name: 'Hotjar',
    description: 'Surveys, feedback, recording references',
  },
  {
    id: 'csv' as IntegrationProvider,
    icon: FileText,
    name: 'CSV Import',
    description: 'Upload structured CSV files',
  },
  {
    id: 'xlsx' as IntegrationProvider,
    icon: FileSpreadsheet,
    name: 'XLSX Import',
    description: 'Upload Excel spreadsheets',
  },
  {
    id: 'manual' as IntegrationProvider,
    icon: PenLine,
    name: 'Manual Evidence',
    description: 'Add qualitative observations and field notes',
  },
]

const GA4_AUTH_TYPES = [
  { value: 'oauth', label: 'Google OAuth', description: 'Standard Google account connection' },
  { value: 'service_account', label: 'Service Account', description: 'For client projects with GCP access' },
  { value: 'api_key', label: 'API / Advanced', description: 'Custom configuration' },
]

export function AddIntegrationDialog({ open, onOpenChange, projectId, onAdded }: Props) {
  const [step, setStep] = useState<Step>('pick')
  const [provider, setProvider] = useState<IntegrationProvider | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    connection_name: '',
    auth_type: 'oauth',
    external_property_id: '',
    external_property_name: '',
    sync_frequency: 'manual',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const selectProvider = (p: IntegrationProvider) => {
    setProvider(p)
    setForm((f) => ({
      ...f,
      connection_name: PROVIDERS.find((pr) => pr.id === p)?.name ?? '',
      auth_type: p === 'ga4' ? 'oauth' : '',
    }))
    setStep('configure')
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!form.connection_name.trim()) errs.connection_name = 'Name is required.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const { data, error } = await getSupabaseClient()
      .from('project_integrations')
      .insert({
        project_id: projectId,
        provider: provider!,
        connection_name: form.connection_name.trim(),
        auth_type: form.auth_type || null,
        external_property_id: form.external_property_id || null,
        external_property_name: form.external_property_name || null,
        sync_frequency: form.sync_frequency,
        status: 'pending',
        capabilities: [],
        settings: {},
      })
      .select()
      .single()

    setLoading(false)
    if (error || !data) {
      setErrors({ submit: error?.message ?? 'Failed to add integration.' })
      return
    }
    reset()
    onAdded(data)
  }

  const reset = () => {
    setStep('pick')
    setProvider(null)
    setForm({ connection_name: '', auth_type: 'oauth', external_property_id: '', external_property_name: '', sync_frequency: 'manual' })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset() }}>
      <DialogContent
        title={step === 'pick' ? 'Add Data Source' : `Configure ${PROVIDERS.find((p) => p.id === provider)?.name}`}
        description={step === 'pick' ? 'Choose the type of data source to connect.' : 'Enter connection details.'}
        size="md"
      >
        <DialogBody>
          {step === 'pick' ? (
            <div className="space-y-1.5">
              {PROVIDERS.map(({ id, icon: Icon, name, description }) => (
                <button
                  key={id}
                  onClick={() => selectProvider(id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3.5',
                    'text-left transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-muted)]',
                    'focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]',
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-secondary)]">
                    <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label required>Connection name</Label>
                <Input
                  value={form.connection_name}
                  onChange={set('connection_name')}
                  placeholder="e.g. My Product GA4"
                  error={errors.connection_name}
                  autoFocus
                />
                <FieldError message={errors.connection_name} />
              </div>

              {provider === 'ga4' && (
                <>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label className="mb-0">Authentication method</Label>
                      <HelpTooltip
                        what="GA4 Authentication"
                        why="OAuth is simplest for your own properties. Service Account is required for client projects where you manage the GCP project."
                        how="Credentials are stored server-side and never exposed to the browser."
                      >
                        <span className="text-[11px] text-[var(--accent-primary)] cursor-help">ⓘ</span>
                      </HelpTooltip>
                    </div>
                    <Select value={form.auth_type} onChange={set('auth_type')}>
                      {GA4_AUTH_TYPES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {GA4_AUTH_TYPES.find((a) => a.value === form.auth_type)?.description}
                    </p>
                  </div>
                  <div>
                    <Label>GA4 Property ID</Label>
                    <Input
                      value={form.external_property_id}
                      onChange={set('external_property_id')}
                      placeholder="e.g. 123456789"
                    />
                  </div>
                  <div>
                    <Label>Property name (optional)</Label>
                    <Input
                      value={form.external_property_name}
                      onChange={set('external_property_name')}
                      placeholder="e.g. My Product - Production"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Sync frequency</Label>
                <Select value={form.sync_frequency} onChange={set('sync_frequency')}>
                  <option value="manual">Manual only</option>
                  <option value="daily">Daily</option>
                </Select>
              </div>

              {errors.submit && <p className="text-[12px] text-[var(--danger)]">{errors.submit}</p>}

              {provider === 'ga4' && (
                <div className="rounded-[var(--radius-md)] bg-[var(--info-muted)] p-3 text-[12px] text-[var(--info)]">
                  <strong>Note:</strong> After saving, you will complete authentication in the next step. Your credentials are stored securely server-side and never exposed to the browser.
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'pick' ? (
            <DialogClose asChild>
              <Button variant="ghost" size="md">Cancel</Button>
            </DialogClose>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={() => setStep('pick')}>Back</Button>
              <Button variant="primary" size="md" loading={loading} onClick={handleSubmit}>
                Save connection
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
