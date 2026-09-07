'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, Label, FieldError } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import type { Project } from '@/lib/types/database'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: Project) => void
}

const PRODUCT_TYPES = ['Web App', 'Mobile App', 'SaaS', 'E-commerce', 'Marketplace', 'API / Platform', 'Other']
const BUSINESS_MODELS = ['B2C', 'B2B', 'B2B2C', 'Freemium', 'Subscription', 'Transactional', 'Advertising', 'Other']

const POC_USER_ID = '00000000-0000-0000-0000-000000000001'

export function CreateProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name: '',
    url: '',
    product_type: '',
    business_model: '',
    description: '',
    main_objective: '',
    assumed_target_users: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate1 = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Project name is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate1()) setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: POC_USER_ID,
        name: form.name.trim(),
        url: form.url || null,
        product_type: form.product_type || null,
        business_model: form.business_model || null,
        description: form.description || null,
        main_objective: form.main_objective || null,
        assumed_target_users: form.assumed_target_users || null,
      })
      .select()
      .single()

    setLoading(false)
    if (error || !data) {
      setErrors({ submit: error?.message ?? 'Failed to create project.' })
      return
    }
    resetAndClose()
    onCreated(data)
  }

  const resetAndClose = () => {
    setForm({ name: '', url: '', product_type: '', business_model: '', description: '', main_objective: '', assumed_target_users: '' })
    setErrors({})
    setStep(1)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose() }}>
      <DialogContent title="New Project" description={step === 1 ? 'Basic information' : 'Context & objectives'} size="md">
        <DialogBody className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <Label required>Project name</Label>
                <Input placeholder="e.g. My SaaS App" value={form.name} onChange={set('name')} error={errors.name} autoFocus />
                <FieldError message={errors.name} />
              </div>
              <div>
                <Label>Website / Product URL</Label>
                <Input placeholder="https://yourproduct.com" value={form.url} onChange={set('url')} type="url" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Product type</Label>
                  <Select value={form.product_type} onChange={set('product_type')}>
                    <option value="">Select…</option>
                    {PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Business model</Label>
                  <Select value={form.business_model} onChange={set('business_model')}>
                    <option value="">Select…</option>
                    {BUSINESS_MODELS.map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="What does the product do? Who is it for?"
                  rows={3}
                  value={form.description}
                  onChange={set('description')}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Main objective</Label>
                <Textarea
                  placeholder="What is the primary goal for this project right now? (e.g. Improve activation rate, reduce churn)"
                  rows={3}
                  value={form.main_objective}
                  onChange={set('main_objective')}
                />
              </div>
              <div>
                <Label>Assumed target users</Label>
                <Textarea
                  placeholder="Who are your users? What do you know about them? (You will refine this with Personas later)"
                  rows={3}
                  value={form.assumed_target_users}
                  onChange={set('assumed_target_users')}
                />
              </div>
              {errors.submit && (
                <p className="text-[12px] text-[var(--danger)]">{errors.submit}</p>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 1 ? (
            <>
              <DialogClose asChild>
                <Button variant="ghost" size="md">Cancel</Button>
              </DialogClose>
              <Button variant="primary" size="md" onClick={handleNext}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" size="md" loading={loading} onClick={handleSubmit}>
                Create project
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
