# Skill: Componente UI

O Componente UI e a camada de componentes visuais reutilizaveis do design system do projeto. Cada componente utiliza CVA (Class Variance Authority) para gerenciar variantes de estilo, `cn()` para merge inteligente de classes Tailwind, e o pattern `asChild` via Radix `Slot` para composicao flexivel. Os componentes UI sao primitivos sem logica de negocio -- eles recebem props, renderizam markup estilizado e delegam comportamento ao consumidor. Ficam isolados em `components/ui/` e sao consumidos por componentes de feature e paginas.

---

## Estrutura do Arquivo

O arquivo de componente UI deve estar localizado em:

```
frontend/src/components/ui/[component].tsx
```

Onde `[component]` representa o nome do componente em kebab-case (ex: `button`, `input-group`, `dialog`, `field`).

Dependencias tipicas de um componente UI:

- **React** - namespace para tipos como `React.ComponentProps`
- **Slot** - componente do `@radix-ui/react-slot` para o pattern `asChild`
- **cva / VariantProps** - funcao e tipo do `class-variance-authority` para definicao de variantes
- **cn** - funcao utilitaria de merge de classes (`@/lib/utils`) que combina `tailwind-merge` + `clsx`

## Template

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const <component>Variants = cva(
  '<base-classes>',
  {
    variants: {
      variant: {
        default: '<default-variant-classes>',
        // ... outras variantes visuais
      },
      size: {
        default: '<default-size-classes>',
        // ... outros tamanhos
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function <Component>({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'<element>'> &
  VariantProps<typeof <component>Variants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : '<element>';

  return (
    <Comp
      data-slot="<component>"
      data-variant={variant}
      data-size={size}
      className={cn(<component>Variants({ variant, size, className }))}
      {...props}
    />
  );
}

export { <Component>, <component>Variants };
```

## Exemplo Real

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

Leitura do exemplo:

1. `buttonVariants` e definido com `cva()` recebendo as classes base (compartilhadas por todas as variantes) como primeiro argumento e o objeto de configuracao como segundo.
2. O objeto `variants` define dois eixos de variacao: `variant` (estilo visual) e `size` (dimensoes). Cada eixo mapeia nomes para strings de classes Tailwind.
3. `defaultVariants` define os valores padrao quando o consumidor nao especifica uma variante -- `variant: 'default'` e `size: 'default'`.
4. A funcao `Button` desestrutura `className`, `variant`, `size`, `asChild` e o rest `...props`. O tipo combina `React.ComponentProps<'button'>` (props nativas do HTML button), `VariantProps<typeof buttonVariants>` (variantes do CVA) e `{ asChild?: boolean }`.
5. `asChild` determina se o componente renderiza como `<button>` ou delega a renderizacao para o filho via `Slot`. Isso permite compor o Button como wrapper de um `<Link>` ou qualquer outro elemento.
6. `data-slot`, `data-variant` e `data-size` sao data-attributes usados para estilizacao condicional e debugging no DOM.
7. `cn(buttonVariants({ variant, size, className }))` resolve as classes da variante selecionada e faz merge com `className` customizado, resolvendo conflitos via `tailwind-merge`.
8. O componente e o objeto de variantes sao exportados como named exports para permitir tanto o uso direto do componente quanto a reutilizacao das variantes em outros contextos.

## Regras e Convencoes

1. **CVA para variantes.** Todo componente com variacoes visuais deve usar `cva()` com a estrutura: classes base como primeiro argumento, objeto com `variants` e `defaultVariants` como segundo. Nunca use condicionais ternarias ou objetos manuais para alternar classes.

2. **`cn()` para merge de classes.** Sempre use `cn()` de `@/lib/utils` para combinar classes. Essa funcao utiliza `tailwind-merge` + `clsx` internamente, resolvendo conflitos de classes Tailwind automaticamente (ex: `p-2` + `p-4` resulta em `p-4`). Nunca concatene strings de classes manualmente.

3. **`Slot` de `@radix-ui/react-slot` para o pattern `asChild`.** Quando `asChild={true}`, o componente nao renderiza seu elemento raiz -- ele delega a renderizacao para o filho direto, transferindo todas as props e classes. Isso permite compor primitivos UI com elementos de navegacao (`<Link>`) ou outros componentes sem wrappers extras.

4. **`data-attributes` para estados e metadados.** Use `data-slot` para identificar o componente no DOM, `data-variant` e `data-size` para expor a variante ativa. Esses atributos sao uteis para estilizacao via seletores CSS (`[data-variant="destructive"]`) e para debugging.

5. **`React.ComponentProps<'element'>` para herdar props nativas.** O tipo de props do componente deve estender `React.ComponentProps` do elemento HTML correspondente. Isso garante que o consumidor pode passar qualquer prop nativa (ex: `onClick`, `disabled`, `aria-label`) sem necessidade de re-declaracao.

6. **Exportar componente + variants.** O arquivo deve exportar tanto a funcao do componente quanto o objeto de variantes como named exports. O objeto de variantes e util quando outro componente precisa reutilizar as mesmas classes (ex: um `ButtonLink` que aplica `buttonVariants` sobre um `<a>`).

7. **Componentes UI sao stateless e sem logica de negocio.** Eles recebem props, renderizam JSX estilizado e delegam eventos ao consumidor. Nunca coloque fetching de dados, mutations, ou regras de dominio dentro de um componente UI.

8. **Nomeacao: funcao PascalCase, variantes camelCase.** A funcao do componente segue PascalCase (`Button`, `InputGroup`). O objeto de variantes segue camelCase com sufixo `Variants` (`buttonVariants`, `inputGroupVariants`).

9. **Classes base devem incluir estilos de acessibilidade.** Focus-visible (`focus-visible:ring`), disabled (`disabled:pointer-events-none disabled:opacity-50`) e estados de interacao (`hover:`, `active:`) devem estar nas classes base ou nas variantes conforme apropriado.

10. **`defaultVariants` e obrigatorio.** Sempre defina valores padrao para todas as variantes no objeto `defaultVariants`. Isso garante que o componente funcione sem que o consumidor precise especificar variantes explicitamente.

## Checklist

- [ ] Arquivo localizado em `frontend/src/components/ui/[component].tsx`
- [ ] `cva()` usado para definir variantes com classes base + variants object + defaultVariants
- [ ] `cn()` importado de `@/lib/utils` e usado para merge de classes
- [ ] `Slot` importado de `@radix-ui/react-slot` para pattern `asChild`
- [ ] Tipo de props estende `React.ComponentProps<'element'>` para heranca de props nativas
- [ ] `VariantProps<typeof componentVariants>` incluido no tipo de props
- [ ] `asChild` como prop opcional booleana
- [ ] `data-slot` presente no elemento raiz para identificacao
- [ ] `data-variant` e `data-size` presentes quando aplicavel
- [ ] `defaultVariants` definido para todas as variantes
- [ ] Componente e variantes exportados como named exports
- [ ] Nenhuma logica de negocio ou state management no componente
- [ ] Estilos de acessibilidade presentes (focus-visible, disabled)
- [ ] Funcao do componente em PascalCase, objeto de variantes em camelCase com sufixo `Variants`
- [ ] Classes Tailwind sem conflitos (verificar com `cn()`)

## Erros Comuns

1. **Concatenar strings de classes ao inves de usar `cn()`.** Concatenacao manual como `"bg-red " + className` causa conflitos de classes Tailwind que `tailwind-merge` resolveria automaticamente. Sempre passe todas as classes por `cn()`.

2. **Definir variantes com ternarios ou objetos manuais ao inves de CVA.** Isso resulta em codigo fragil e inconsistente. CVA centraliza a logica de variantes, garante tipagem automatica via `VariantProps` e facilita a adicao de novas variantes sem refatoracao.

3. **Esquecer `defaultVariants` no objeto de configuracao do CVA.** Sem valores padrao, o componente pode renderizar sem classes de variante quando o consumidor nao especifica props, resultando em estilo quebrado ou ausente.

4. **Usar `interface` ao inves de `React.ComponentProps<'element'>`.** Declarar manualmente props como `onClick`, `disabled`, `children` e redundante e incompleto. `React.ComponentProps` herda automaticamente todas as props nativas do elemento HTML correspondente.

5. **Colocar logica de fetch ou state management no componente UI.** Componentes UI sao primitivos visuais puros. Logica de dados pertence a hooks customizados ou componentes de feature. Um `Button` nunca deve fazer uma chamada API ao ser clicado -- isso e responsabilidade do consumidor.

6. **Renderizar sempre o elemento HTML ao inves de suportar `asChild`.** Sem `asChild`, o consumidor nao consegue compor o componente com outros elementos (ex: usar um `Button` como wrapper de um `<Link>` do router). O pattern `Slot` e essencial para composicao flexivel.

7. **Esquecer `data-slot` no elemento raiz.** O `data-slot` permite identificar o componente no DOM e estilizar seletivamente via CSS (ex: `[data-slot="button"]`). Sua ausencia dificulta debugging e estilizacao contextual.

8. **Exportar apenas o componente sem o objeto de variantes.** Sem exportar `buttonVariants`, outros componentes que precisam aplicar os mesmos estilos (ex: um link estilizado como botao) nao conseguem reutilizar as variantes e acabam duplicando classes.

---

> **Cross-references:** ver [021-skill-form-field.md](./021-skill-form-field.md) para componentes de formulario que consomem componentes UI como `Field`, `InputGroup` e `FieldLabel`
