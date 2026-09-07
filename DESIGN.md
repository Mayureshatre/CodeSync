# CodeSync — Final Design & Motion Specification

**Tagline:** _“Where developers find their missing piece.”_  
**Visual Identity:** _Syntactic Velocity (Refined)_ — Sophisticated dark-first developer matchmaking & collaboration platform.

---

## 1. Design System & Token Foundation

### 1.1 Color Tokens

CodeSync uses a disciplined, dark-first graphite foundation where Cyan acts as an intentional brand marker and primary action anchor, rather than ambient neon decoration.

### 1.2 Typography System

- **Primary typeface:** Plus Jakarta Sans
  - Clean, geometric, contemporary sans-serif.
- **Technical typeface:** JetBrains Mono or Fira Code
  - Used strictly for:
    - Code tokens
    - Syntax snippets
    - Match percentages
    - Telemetry metadata

Normal UI copy must use the primary sans-serif typeface.

### 1.3 Spacing Scale & Layout Grid

Built on a 4px modular base grid (`rem` equivalents).

| Token      | Size | Usage                                                                 |
| ---------- | ---: | --------------------------------------------------------------------- |
| `space-1`  |  4px | Micro gaps, icon-to-label spacing inside small pills                  |
| `space-2`  |  8px | Stack chip padding, small button gaps, segmented control padding      |
| `space-3`  | 12px | Standard inner card padding, input internal vertical padding          |
| `space-4`  | 16px | Default component padding, standard mobile gutters, card body spacing |
| `space-5`  | 20px | Section inner padding, bottom sheet headers                           |
| `space-6`  | 24px | Card-to-card vertical rhythm, form field separation                   |
| `space-8`  | 32px | Major layout section gaps, onboarding step spacing                    |
| `space-12` | 48px | Page section dividers, hero margins                                   |

---

## 1.4 Border Radius & Shadows

### Border Radius

| Token         |   Size | Usage                                                  |
| ------------- | -----: | ------------------------------------------------------ |
| `radius-sm`   |    6px | Small badges, code pills, mini checkboxes              |
| `radius-md`   |    8px | Form inputs, default buttons, tech stack chips         |
| `radius-lg`   |   12px | Opportunity cards, profile summary containers, dialogs |
| `radius-xl`   |   16px | Modal sheets, floating bottom navigation, hero banners |
| `radius-full` | 9999px | Avatars, pill badges, toggle switches                  |

### Shadows & Elevation

Atmospheric and subtle. Avoid heavy glow blooms.

- **`elevation-flat`**
  - `0 0 0 1px #263042`
  - Crisp 1px border; default for cards.

- **`elevation-low`**
  - `0 2px 8px rgba(0, 0, 0, 0.45), 0 0 0 1px #263042`
  - Hovered cards.

- **`elevation-overlay`**
  - `0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px #263042`
  - Modals and dropdowns.

- **`focus-glow`**
  - `0 0 0 2px #06b6d4, 0 0 12px rgba(6, 182, 212, 0.2)`
  - Keyboard accessibility focus state.

---

# 2. Component Specifications

## 2.1 Buttons

### Primary CTA

- Background: `#06b6d4`
- Text: `#0a0e16`
- Font weight: 700
- Hover: `#0891b2`
- Active: `#0e7490`
- Padding: `12px 20px`
- Minimum height: `44px`
- Icon:
  - Trailing arrow or leading context glyph
  - 8px margin from text

### Secondary / Outline

- Background: transparent
- Border: `1px solid #263042`
- Text: `#f1f5f9`
- Hover:
  - Background: `#1e2433`
  - Border: `#334155`

### Tertiary / Ghost

- Background: transparent
- Text: `#94a3b8`
- Hover:
  - Text: `#f1f5f9`
  - Background: `rgba(255,255,255,0.04)`

### Destructive

- Background: `rgba(239, 68, 68, 0.1)`
- Border: `1px solid rgba(239, 68, 68, 0.3)`
- Text: `#ef4444`

---

## 2.2 Form Inputs & Controls

### Text Inputs & Password Fields

- Background: `#141822`
- Border: `1px solid #263042`
- Typography: 14px Plus Jakarta Sans
- Placeholder: `#64748b`
- Leading icon:
  - 20px
  - `#64748b`
- Trailing state icon:
  - Checkmark
  - Show/hide password toggle
  - Other contextual states

### Segmented Controls — Proficiency Matrix

- Container:
  - Background: `#0f131c`
  - Border: `1px solid #263042`
  - Radius: 8px
- Option buttons:
  - Equal flex width
  - 12px font size
- Active:
  - `#06b6d4`
  - Or `#10b981` for top tier
  - Text: `#0a0e16`
  - Font weight: bold
- Inactive:
  - Transparent
  - Text: `#94a3b8`
  - Hover: `#181c24`

### Skill Tags & Selection Chips

#### Inactive / Suggestion

- Background: `#181c24`
- Border: `1px solid #263042`
- Text: `#94a3b8`
- Prefix: `+`

#### Selected / Active

- Background: `#141822`
- Border: `1px solid #06b6d4`
- Text: `#f1f5f9`
- Cyan bullet indicator
- Trailing `×` dismiss button

---

# 2.3 Cards & Containers

## Curated Match Opportunity Card

Background:

```text
#181c24
```
