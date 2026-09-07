# Design System

## Tokens (globals.css)
All tokens are CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark).

### Backgrounds
| Token | Light | Dark |
|---|---|---|
| `--bg-primary` | #FFFFFF | #0C0C0B |
| `--bg-secondary` | #F7F7F6 | #141413 |

### Surfaces
| Token | Light | Dark |
|---|---|---|
| `--surface-primary` | #FFFFFF | #1A1A18 |
| `--surface-secondary` | #F2F2F0 | #222220 |
| `--surface-elevated` | #FFFFFF | #2A2A27 |

### Text
| Token | Usage |
|---|---|
| `--text-primary` | Main content |
| `--text-secondary` | Labels, secondary content |
| `--text-muted` | Metadata, captions, placeholders |
| `--text-inverse` | Text on dark/accent backgrounds |

### Borders
| Token | Usage |
|---|---|
| `--border-subtle` | Card borders, dividers |
| `--border-strong` | Input hover, stronger separation |

### Accent
| Token | Usage |
|---|---|
| `--accent-primary` | Primary CTA, active states |
| `--accent-hover` | Hover state for accent |
| `--accent-muted` | Accent background tint |

### Evidence Types
| Type | Token | Meaning |
|---|---|---|
| Observed | `--evidence-observed` | Directly measured / declared by real users |
| Inferred | `--evidence-inferred` | Interpretation from real data |
| Generated | `--evidence-generated` | AI hypothesis, no real backing |
| Validated | `--evidence-validated` | Confirmed by sufficient real evidence |

## Typography Scale
| Role | Size | Weight | Notes |
|---|---|---|---|
| Page Title | 22px | 600 | tracking-tight |
| Section Title | 13px | 600 | uppercase, tracking-wide |
| Card Title | 14px | 600 | |
| Body | 14px | 400 | |
| Label | 12px | 500 | |
| Metadata | 11px | 400 | text-muted |
| Metric | 28–32px | 700 | tracking-tight, leading-none |
| Caption | 11px | 400 | |

## Radius Scale
| Name | Value | Used for |
|---|---|---|
| `--radius-sm` | 4px | Badges, chips |
| `--radius-md` | 8px | Buttons, inputs, small cards |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Large containers |
| `--radius-panel` | 20px | Modals, drawers |

## Spacing
Base unit: 4px. Scale: 4, 8, 12, 16, 24, 32, 48, 64.

## Components
| Component | File | Notes |
|---|---|---|
| Button | `components/ui/button.tsx` | 5 variants, 4 sizes, loading state |
| Tooltip | `components/ui/tooltip.tsx` | Radix-based, HelpTooltip for What/Why/How |
| Badge | `components/ui/badge.tsx` | EvidenceTag, PersonaStatusBadge included |
| Input, Textarea, Select | `components/ui/input.tsx` | With Label, FieldError |
| Dialog | `components/ui/dialog.tsx` | DialogContent, DialogBody, DialogFooter |
| Card, StatCard | `components/ui/card.tsx` | |
| EmptyState, LoadingState, ErrorState, Skeleton | `components/ui/empty-state.tsx` | |
| PageHeader, SectionHeader | `components/ui/page-header.tsx` | |

## Navigation
Left sidebar, 220px expanded / 56px collapsed. Collapse toggle at top-right of sidebar.
Project context always visible at top of sidebar.
Theme toggle at bottom.
