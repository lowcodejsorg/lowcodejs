# Skill: Form Field

O Form Field e a camada de componentes de campo de formulario que conecta o TanStack Form ao design system do projeto. Cada componente encapsula a logica de estado do campo (valor, validacao, touched) atraves de `useFieldContext`, renderiza os componentes UI primitivos (`Field`, `FieldLabel`, `InputGroup`, `FieldError`) e gerencia acessibilidade com `aria-invalid` e `htmlFor`. Os form fields sao compostos por componentes UI puros e existem um por tipo de input, mantendo separacao clara entre logica de formulario e apresentacao visual.

---

## Estrutura do Arquivo

O arquivo de form field deve estar localizado em:

```
frontend/src/components/common/tanstack-form/field-[type].tsx
```

Onde `[type]` representa o tipo de input (ex: `text`, `password`, `select`, `textarea`, `checkbox`).

Dependencias tipicas de um form field:

- **Field / FieldError / FieldLabel** - componentes UI primitivos de `@/components/ui/field`
- **InputGroup / InputGroupAddon / InputGroupInput / InputGroupButton** - componentes UI de grupo de input de `@/components/ui/input-group`
- **useFieldContext** - hook do TanStack Form para acessar estado do campo (`@/integrations/tanstack-form/form-context`)

O form context e criado uma unica vez no projeto:

```typescript
// frontend/src/integrations/tanstack-form/form-context.ts
import { createFormHookContexts } from '@tanstack/react-form';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
```

## Template

```typescript
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

interface Field<Type>Props {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function Field<Type>({
  label,
  placeholder,
  disabled,
  icon,
}: Field<Type>Props): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          disabled={disabled}
          id={field.name}
          name={field.name}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {icon && <InputGroupAddon>{icon}</InputGroupAddon>}
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
```

## Exemplo Real

### FieldText

```typescript
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';

interface FieldTextProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function FieldText({
  label,
  placeholder,
  disabled,
  icon,
}: FieldTextProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          disabled={disabled}
          id={field.name}
          name={field.name}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {icon && <InputGroupAddon>{icon}</InputGroupAddon>}
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
```

### FieldPassword

```typescript
import { useState } from 'react';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface FieldPasswordProps {
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function FieldPassword({
  label,
  placeholder,
  disabled,
}: FieldPasswordProps): React.JSX.Element {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          disabled={disabled}
          id={field.name}
          name={field.name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <InputGroupButton
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
```

Leitura dos exemplos:

1. `useFieldContext<string>()` acessa o estado do campo via contexto do TanStack Form. O tipo generico (`<string>`) define o tipo do valor do campo, garantindo tipagem correta em `field.state.value` e `field.handleChange`.
2. `isInvalid` combina `isTouched` (usuario interagiu com o campo) e `!isValid` (campo tem erros de validacao). Essa combinacao evita mostrar erros antes da primeira interacao do usuario.
3. `Field` e o wrapper que recebe `data-invalid` para estilizacao condicional via CSS (ex: borda vermelha quando invalido).
4. `FieldLabel` recebe `htmlFor={field.name}` para associar o label ao input, melhorando acessibilidade. Clicar no label foca o input.
5. `InputGroupInput` conecta o campo ao TanStack Form via `value={field.state.value}`, `onBlur={field.handleBlur}` e `onChange={(e) => field.handleChange(e.target.value)}`.
6. `aria-invalid={isInvalid}` comunica o estado de erro para leitores de tela.
7. `FieldError` so renderiza quando `isInvalid` e verdadeiro, recebendo `field.state.meta.errors` -- o array de mensagens de erro do TanStack Form.
8. No `FieldPassword`, `InputGroupButton` substitui `InputGroupAddon` para o botao de toggle de visibilidade. O `type="button"` impede que o botao submeta o formulario, e `aria-label` descreve a acao para leitores de tela.

## Regras e Convencoes

1. **`useFieldContext<T>()` para acessar estado do campo.** Sempre use `useFieldContext` com o tipo generico do valor do campo. Nunca acesse o estado do formulario diretamente ou passe o campo via props -- o contexto do TanStack Form gerencia isso automaticamente.

2. **`isInvalid = isTouched && !isValid`.** Essa e a formula padrao para determinar se o campo deve exibir estado de erro. Nunca mostre erros em campos que o usuario ainda nao interagiu (`isTouched: false`).

3. **`Field` como wrapper com `data-invalid`.** Todo form field deve ter `Field` como elemento raiz com `data-invalid={isInvalid}`. Isso permite estilizacao condicional via CSS como `[data-invalid="true"] input { border-color: red }`.

4. **`FieldLabel` com `htmlFor`.** Todo campo deve ter um label associado ao input via `htmlFor={field.name}`. O `field.name` e a mesma string usada como `id` do input, garantindo a associacao correta.

5. **`FieldError` condicional.** O componente `FieldError` so deve renderizar quando `isInvalid` e verdadeiro. Renderizar incondicionalmente pode mostrar mensagens vazias ou reservar espaco desnecessario no layout.

6. **`InputGroup` para layout com icone ou botao.** Use `InputGroupAddon` para icones decorativos e `InputGroupButton` para botoes interativos (ex: toggle de senha). Nunca coloque icones ou botoes diretamente dentro do input.

7. **`handleBlur` + `handleChange` para sincronizar com TanStack Form.** O `onBlur` deve chamar `field.handleBlur` para atualizar o estado `isTouched`. O `onChange` deve chamar `field.handleChange(e.target.value)` para atualizar o valor. Nunca use `useState` local para gerenciar o valor do campo -- o TanStack Form e a unica fonte de verdade.

8. **`aria-invalid` para acessibilidade.** Todo input deve receber `aria-invalid={isInvalid}` para que leitores de tela identifiquem campos com erro. Isso e complementar ao `FieldError` visual.

9. **Um arquivo por tipo de campo.** Cada tipo de input tem seu proprio arquivo: `field-text.tsx`, `field-password.tsx`, `field-select.tsx`. Nunca agrupe multiplos tipos de campo no mesmo arquivo.

10. **Interface de props com `label` obrigatorio.** Todo form field deve receber pelo menos `label: string` como prop obrigatoria. Props opcionais comuns sao `placeholder`, `disabled` e `icon`.

11. **O form context e criado uma unica vez** em `frontend/src/integrations/tanstack-form/form-context.ts` usando `createFormHookContexts()`. Nunca crie contextos adicionais de formulario -- todos os form fields compartilham o mesmo contexto.

12. **`type="button"` em botoes dentro do InputGroup.** Botoes como toggle de visibilidade devem ter `type="button"` explicitamente para evitar que submetam o formulario quando pressionados.

## Checklist

- [ ] Arquivo localizado em `frontend/src/components/common/tanstack-form/field-[type].tsx`
- [ ] `useFieldContext<T>()` usado com tipo generico correto
- [ ] `isInvalid` calculado como `field.state.meta.isTouched && !field.state.meta.isValid`
- [ ] `Field` como wrapper raiz com `data-invalid={isInvalid}`
- [ ] `FieldLabel` com `htmlFor={field.name}`
- [ ] `InputGroupInput` com `id={field.name}` e `name={field.name}`
- [ ] `value={field.state.value}` conectando o input ao TanStack Form
- [ ] `onBlur={field.handleBlur}` para atualizar `isTouched`
- [ ] `onChange={(e) => field.handleChange(e.target.value)}` para atualizar valor
- [ ] `aria-invalid={isInvalid}` presente no input
- [ ] `FieldError` renderizado condicionalmente apenas quando `isInvalid`
- [ ] `FieldError` recebe `errors={field.state.meta.errors}`
- [ ] Interface de props declarada com `label: string` obrigatorio
- [ ] Nenhum `useState` para gerenciar valor do campo (exceto estado local como toggle de senha)
- [ ] Botoes dentro do `InputGroup` com `type="button"` explicito
- [ ] `aria-label` em botoes de acao (ex: toggle de senha)

## Erros Comuns

1. **Mostrar erros de validacao antes do usuario interagir com o campo.** Usar apenas `!isValid` sem `isTouched` exibe erros no carregamento do formulario, antes do usuario tocar no campo. Sempre combine ambas as condicoes: `isTouched && !isValid`.

2. **Usar `useState` local para gerenciar o valor do campo.** O valor do campo pertence ao TanStack Form. Criar um estado local duplica a fonte de verdade e causa dessincronizacao entre o valor exibido e o valor no formulario. A unica excecao e estado local de UI como `showPassword`.

3. **Esquecer `onBlur={field.handleBlur}`.** Sem `handleBlur`, o estado `isTouched` nunca e atualizado para `true`, e os erros de validacao nunca sao exibidos mesmo apos o usuario interagir com o campo.

4. **Esquecer `htmlFor` no `FieldLabel` ou `id` no input.** Sem a associacao `htmlFor`/`id`, clicar no label nao foca o input correspondente, prejudicando a acessibilidade e a experiencia do usuario.

5. **Renderizar `FieldError` incondicionalmente.** Sem a verificacao `isInvalid`, o componente pode renderizar um container vazio que ocupa espaco no layout ou exibir mensagens de erro em campos nao tocados.

6. **Esquecer `aria-invalid` no input.** Leitores de tela nao conseguem identificar campos com erro sem esse atributo. O `FieldError` visual nao e suficiente para acessibilidade -- `aria-invalid` e complementar e obrigatorio.

7. **Omitir `type="button"` em botoes dentro do formulario.** Sem `type="button"`, botoes dentro de `<form>` tem `type="submit"` por padrao. Clicar no botao de toggle de senha submete o formulario ao inves de alternar a visibilidade.

8. **Criar multiplos contextos de formulario.** Chamar `createFormHookContexts()` mais de uma vez cria contextos independentes que nao compartilham estado. Todos os form fields devem importar de `@/integrations/tanstack-form/form-context`.

9. **Passar o field object via props ao inves de usar `useFieldContext`.** O TanStack Form gerencia campos via contexto React. Passar o field como prop quebra o pattern do framework e pode causar problemas de re-render e sincronizacao.

10. **Esquecer `data-invalid` no wrapper `Field`.** Sem esse data-attribute, os estilos condicionais de erro (borda vermelha, background, etc.) nao sao aplicados ao wrapper do campo, resultando em feedback visual inconsistente.

---

> **Cross-references:** ver [020-skill-formulario.md](./020-skill-formulario.md) para como os form fields sao compostos dentro de formularios completos com TanStack Form | [022-skill-componente-ui.md](./022-skill-componente-ui.md) para os componentes UI primitivos (`Field`, `InputGroup`, `FieldLabel`, `FieldError`) consumidos pelos form fields
