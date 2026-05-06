---
name: LowCodeJs Design System
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.141 0.005 285.823)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.141 0.005 285.823)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.141 0.005 285.823)"
  primary: "oklch(0.402 0.179 261.6)"
  primary-foreground: "oklch(0.97 0.014 254.604)"
  secondary: "oklch(0.967 0.001 286.375)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  accent: "oklch(0.967 0.001 286.375)"
  accent-foreground: "oklch(0.21 0.006 285.885)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.92 0.004 286.32)"
  input: "oklch(0.92 0.004 286.32)"
  ring: "oklch(0.708 0 0)"
  brand-orange: "oklch(0.791 0.152 67.9)"
  brand-orange-light: "oklch(0.786 0.142 64.1)"
  brand-blue-dark: "oklch(0.367 0.132 260.1)"
  brand-blue-mid: "oklch(0.393 0.163 260.6)"
typography:
  font-sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-mono:
    fontFamily: "source-code-pro, Menlo, Monaco, Consolas, monospace"
  text-sm:
    fontSize: "0.875rem"
    lineHeight: "1.25rem"
    fontWeight: "500"
  text-base:
    fontSize: "1rem"
    lineHeight: "1.5rem"
    fontWeight: "400"
  text-lg:
    fontSize: "1.125rem"
    lineHeight: "1.75rem"
    fontWeight: "600"
rounded:
  sm: "calc(0.65rem - 4px)"
  DEFAULT: "0.65rem"
  md: "calc(0.65rem - 2px)"
  lg: "0.65rem"
  xl: "calc(0.65rem + 4px)"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.text-sm}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "oklch(0.402 0.179 261.6 / 0.9)"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.text-sm}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-secondary-hover:
    backgroundColor: "oklch(0.967 0.001 286.375 / 0.8)"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    border: "1px solid {colors.input}"
    typography: "{typography.text-sm}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    border: "1px solid {colors.input}"
    typography: "{typography.text-sm}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
---

## Brand & Style
The LowCodeJs design system emphasizes a clean, highly professional, and modern aesthetic. It is deeply rooted in a utility-first approach utilizing tailwindcss paired with the "New York" style of standard UI components (like shadcn/ui). The brand personality is efficient, reliable, and developer-friendly, offering an environment that feels natively integrated into a modern operating system workspace.

The UI leverages a high-contrast, minimalist setup. It doesn't rely on overly vibrant or dramatic gradients but uses solid, intentional color blocks. The interfaces are highly structured with visible but subtle borders separating distinct functional areas, giving it a tactile "dashboard" feel. 

## Colors
The color palette relies on the modern `oklch` color space, prioritizing perceptual uniformity, which ensures consistent contrast and brightness across the light and dark themes.

- **Primary Canvas:** Crisp white in light mode, and a deep, muted charcoal/indigo in dark mode to reduce eye strain for long sessions.
- **Brand Colors:** A deep indigo/purple serves as the primary actionable color, establishing a strong, trustworthy accent. Additional brand accents include a vibrant orange and a darker blue, often used for data visualization or specific feature callouts.
- **Grays & Neutrals:** Surfaces, borders, and inputs use finely tuned neutral grays with a very slight cool undertone.
- **Semantic Feedback:** Destructive actions use a muted red (`destructive`), ensuring they stand out without being overwhelmingly harsh.

## Typography
Typography is strictly utilitarian and performance-focused, relying on the user's native system fonts (`-apple-system`, `BlinkMacSystemFont`, etc.) alongside `Geist` or similar neo-grotesque sans-serifs. 

- **Readability:** Fonts are rendered with antialiasing enabled (`-webkit-font-smoothing: antialiased`).
- **Hierarchy:** There is a distinct preference for smaller, denser text (`text-sm` is heavily utilized for buttons, inputs, and standard UI elements) to maximize the information density of the dashboard interface.
- **Data & Code:** Monospace fonts are used intentionally for code blocks and technical identifiers, ensuring clear legibility of technical data.

## Layout & Spacing
The layout relies on a strict grid and flexbox system to maintain alignment. 

- **Density:** The "New York" style implies a slightly tighter, more compact spacing scale compared to consumer-facing apps. Gaps between elements are typically small (`0.5rem` to `1rem`), allowing for complex forms and data tables to fit comfortably on screen.
- **Structure:** Content is typically housed within `cards` or bordered panels to create clear visual separation between distinct modules or tasks.

## Elevation & Depth
Depth is extremely subtle, favoring a flat or "border-first" approach over heavy drop-shadows.

- **Borders:** Almost all depth and separation are achieved via thin `1px` borders using the defined `border` or `input` colors. 
- **Focus States:** Accessibility and keyboard navigation are first-class citizens. Focused elements receive a thick `3px` focus ring (`focus-visible:ring-[3px]`) with reduced opacity (`ring/50`) utilizing the `ring` color. This creates a highly visible, glowing halo around active inputs and buttons.
- **Shadows:** Drop shadows (`shadow-xs`) are used very sparingly, mostly reserved for floating elements like popovers, dropdown menus, and tooltips.

## Shapes
The shape language is slightly rounded but remains structured and sharp enough to feel professional.

- **Border Radius:** The system relies on a base `--radius` of `0.65rem` (approx. 10.4px). 
- **Application:** Cards and larger structural elements use the full `lg` radius, while internal interactive elements like buttons and inputs use a slightly tighter `md` (approx. 8px) radius. This creates a nested "pill within a box" effect that feels cohesive.

## Motion & Interaction
Animations are purposeful, non-obtrusive, and optimized for performance.

- **Micro-interactions:** Buttons and interactive elements feature swift transition states, primarily shifting background opacity or utilizing tonal changes (e.g., `hover:bg-primary/90`) rather than dramatic scaling or moving.
- **Keyframe Animations:** The system includes a suite of subtle utility animations:
  - `fade-in`: For smooth appearance of new data.
  - `slide-up-fade`: For popovers and modal entrances.
  - `shimmer`: A loading state animation applied to skeletons to indicate background processing.
  - `pulse-dot`: For live-status indicators.
  - `float`: Used sparingly for empty-state illustrations or branding elements.
- **Accessibility:** All animations respect user system preferences (`prefers-reduced-motion: reduce`) by neutralizing transition durations automatically.
