# CodeSync Design & Interaction Specification

## 1. Product Visual Identity
CodeSync is a **premium, modern developer collaboration platform**.

**The desired feeling:** Premium, modern, sophisticated, clean, trustworthy, approachable, and alive.

**It should NOT feel:** Cyberpunk, hacker-themed, terminal-like, excessively neon, visually noisy, or like a developer IDE/tool.

**Core Identity Principle:**
> "CodeSync is a premium modern platform built for developers, not a developer-themed website."

## 2. Design Foundation: Premium Minimal
The foundation of CodeSync is **Premium Minimal**. Before any decorative effects are applied, the interface must be visually strong, clear, and highly functional.
- Generous but controlled whitespace
- Clean, spacious layouts
- Strong typography hierarchy
- Mostly neutral surfaces
- Subtle borders and refined shadows
- Restrained decoration and minimal visual noise
- Clear information hierarchy
- Accessible contrast

The interface must remain visually strong even if all Aurora effects are removed.

## 3. Modern Aurora Personality
The **Modern Aurora** aesthetic provides CodeSync's personality. Aurora is an accent layer, NOT the foundation.
- Subtle blue/purple atmospheric and mesh/radial gradients
- Soft color transitions and layered depth
- Selective use around important areas (e.g., active states, hero backgrounds)
- Restrained glow

**Explicitly Prohibited:**
- Gradients everywhere
- Heavy neon glow or excessive saturation
- Decorative effects without purpose

## 4. Light + Dark Mode
Both light mode and dark mode are equally important, first-class experiences. Neither mode is simply an inversion of the other. The final implementation must support explicit light mode, explicit dark mode, and system preference with a smooth but lightweight theme transition. Do not prescribe a specific theme library yet.

**Semantic Tokens:**
- `background`: Page background
- `surface`: Standard card/container background
- `surface-elevated`: Floating elements (modals, dropdowns)
- `text-primary`: Headings and primary body copy
- `text-secondary`: Supporting text
- `text-muted`: Disabled or placeholder text
- `border`: Subtle delineations
- `accent-primary`: Primary actions and branding
- `accent-secondary`: Supporting branded elements
- `success`: Positive states
- `warning`: Caution states
- `error`: Destructive states
- `aurora-1`, `aurora-2`, `aurora-3`: Gradient mesh colors

## 5. Color System (Arctic Aurora)
The primary palette uses a neutral foundation with indigo/blue primary accents, purple secondary accents, subtle cyan/sky support, and restrained green for positive states. 

*Note: Implementation values may be adjusted during visual validation for accessibility and contrast.*

**Light Mode Semantic Target:**
- Background: `#FAFAFA`
- Surface: `#FFFFFF`
- Text Primary: `#111827`
- Text Secondary: `#6B7280`
- Border: `#E5E7EB`
- Accent Primary: `#4F46E5` (Indigo)
- Aurora Colors: Indigo, Purple, Sky

**Dark Mode Semantic Target:**
- Background: `#09090B`
- Surface: `#18181B`
- Text Primary: `#F9FAFB`
- Text Secondary: `#A1A1AA`
- Border: `#27272A`
- Accent Primary: `#6366F1` (Soft Indigo)
- Aurora Colors: Soft Indigo, Amethyst, Sky

## 6. Typography
**Primary Direction: Geist + Geist Mono**

**Geist (Primary UI Font):**
Used for headings, navigation, primary UI elements, normal body content, and buttons. 

**Geist Mono (Technical Font):**
Used strictly for match percentages, technical metadata, technology identifiers (e.g., skill tags), code-related information, and system/telemetry-style secondary information.
*Do NOT use monospace typography for normal body content.*

Typography utilizes a strong hierarchy with heavily contrasted weights for headings vs. body text.

## 7. Component Visual Language
Components must remain clean, restrained, premium, and consistent between light/dark modes.
- **Buttons:** Subtle gradient accents for primary, clear borders for secondary. Soft rounded radii (e.g., 8px-12px).
- **Cards:** Glassy or subtle off-background color. Low elevation shadows. Subtle hover borders.
- **Inputs:** Clean 1px borders, subtle focus rings (using primary accent), transparent backgrounds.
- **Selectors:** Modern pill-based segmented controls.
- **Navigation & Bottom Navigation:** Glassmorphic (blur backdrop) to allow subtle aurora gradients to peek through upon scroll.
- **Badges & Skill Chips:** Soft backgrounds (e.g., accent color at 10-15% opacity) with matching text.
- **Match Indicators:** Minimal rings or progress bars with smooth gradients, utilizing Geist Mono for percentages.
- **Avatars:** Simple, circular, with a 1px inner ring to separate them from the background.
- **Modals & Toasts:** Elevated surfaces (`surface-elevated`) with distinct but soft drop shadows (`elevation-overlay`).
- **Loading/Empty/Error States:** Elegant, minimalist illustrations or subtle pulsing skeleton loaders. Error states use restrained, accessible reds.

## 8. Interaction Design
The website should feel alive without becoming distracting.
> "Alive when interacted with, calm when idle."

- **Cursor-reactive network:** Subtle developer/project nodes that respond gently to cursor movement. Connections represent compatibility, reinforcing the matching concept.
- **Card interaction:** Subtle hover lift (translate Y), slight transform, refined shadow/depth change. No exaggerated 3D effects.
- **Button interaction:** Subtle hover transition (e.g., brightness/opacity shift), slight press scale (e.g., 0.98), responsive feedback.
- **Aurora movement:** Slow, subtle atmospheric movement. Never distracting. CSS-first where practical.
- **Scroll reveals:** Subtle opacity/transform transitions, staggered only where useful.

## 9. Performance Requirements
Performance is a hard design requirement.
> "Premium, not heavy."

**Prefer:**
- CSS transitions and transforms
- Opacity changes
- Lightweight JavaScript
- GPU-friendly transforms
- Lazy-loaded interactive effects
- `requestAnimationFrame` only when genuinely necessary

**Avoid:**
- WebGL (unless explicitly justified later)
- Heavy canvas scenes or video backgrounds
- Unnecessary animation libraries
- Continuously expensive animations
- Layout-triggering animations

**Accessibility in Performance:**
Require reduced-motion support, mobile fallbacks, static fallbacks, and execute interaction only when appropriate/visible.

## 10. Responsive Design
Design is mobile-first and must work across mobile, tablet, and desktop viewports. Do not design around fixed screenshot dimensions. Interactive effects must degrade gracefully on touch devices (e.g., replacing hover states with active states or static reveals).

## 11. Accessibility
Visual effects must never interfere with usability.
- WCAG-conscious contrast ratios
- Visible focus states for keyboard navigation
- Semantic HTML
- Accessible labels and ARIA attributes where needed
- Generous touch target sizing (minimum 44x44px for mobile targets)
- Respect for `prefers-reduced-motion`

## 12. Design Philosophy
1. Premium over flashy.
2. Clarity over decoration.
3. Interaction with purpose.
4. Light and dark are equally important.
5. Aurora is an accent, not the entire design.
6. Technical details should feel technical without making the entire UI look like a terminal.
7. Performance is part of the design.
8. The interface should communicate the idea of developers finding complementary people and projects.

## 13. Stitch Reference Notice
*Important:* The previously supplied Stitch screenshots (featuring the "Dark Graphite + Cyan + Developer Terminal" aesthetic) are historical visual references. The NEW Premium Minimal + Modern Aurora direction documented in this file entirely supersedes the old Stitch visual treatment. Outdated Graphite/Cyan/terminal-specific rules are officially deprecated.
