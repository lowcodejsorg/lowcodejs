# Estilos e Temas

## Visao Geral

O frontend utiliza **Tailwind CSS v4** com CSS variables em formato **OKLCH** para cores. O tema suporta **dark mode** via `next-themes` com a classe `.dark`.

---

## src/styles.css

### Imports

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));
```

| Import | Funcao |
|---|---|
| `tailwindcss` | Framework CSS utility-first |
| `tw-animate-css` | Animacoes pre-definidas |
| `@tailwindcss/typography` | Estilos para conteudo rico (prose) |
| `@custom-variant dark` | Variante dark mode baseada em classe |

---

## Variaveis de Cor (CSS Custom Properties)

### Modo Claro (`:root`)

```css
:root {
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.488 0.243 264.376);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.967 0.001 286.375);
  --muted: oklch(0.967 0.001 286.375);
  --accent: oklch(0.967 0.001 286.375);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.92 0.004 286.32);
  --ring: oklch(0.708 0 0);
  /* chart-1 a chart-5, sidebar-* */
}
```

### Modo Escuro (`.dark`)

```css
.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.885);
  --primary: oklch(0.488 0.243 264.376);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  /* ... */
}
```

---

## Mapeamento de Tema (@theme inline)

O bloco `@theme inline` mapeia CSS variables para o sistema de cores do Tailwind:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  /* sidebar-*, chart-* */
}
```

Isso permite usar classes como `bg-primary`, `text-foreground`, `border-border` etc.

---

## Estilos Customizados

### Scrollbar do Kanban

```css
.kanban-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--kanban-scroll-thumb, rgba(148, 163, 184, 0.35)) transparent;
}
```

### Editor Compacto

```css
.editor-compact .tiptap.ProseMirror {
  padding: 4px 6px;
  min-height: 100px !important;
}
```

### Estilos de Impressao

```css
.print-only { display: none; }

@media print {
  .print-only { display: block !important; }
  .no-print { display: none !important; }
  .print-toc { break-after: page; }
  article { break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; }
}
```

---

## Tailwind Plugins

| Plugin | Fonte | Funcao |
|---|---|---|
| `@tailwindcss/vite` | Vite plugin | Processamento Tailwind no build |
| `@tailwindcss/typography` | CSS plugin | Estilos `prose` para conteudo rich text |
| `tw-animate-css` | CSS import | Animacoes pre-definidas |

---

## Padrao de Estilizacao dos Componentes

Os componentes UI utilizam **CVA** (class-variance-authority) para gerenciar variantes:

```typescript
// Exemplo: src/components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center ...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground ...',
        destructive: 'bg-destructive text-white ...',
        outline: 'border border-input bg-background ...',
        secondary: 'bg-secondary text-secondary-foreground ...',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

A funcao `cn()` de `src/lib/utils.ts` combina `clsx` + `tailwind-merge` para merge inteligente de classes:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```
