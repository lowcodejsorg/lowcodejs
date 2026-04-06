# form-footer — Rodapé de Formulários

Componente reutilizável para o rodapé de formulários com botões de cancelar e
salvar, integrado ao estado do TanStack Form.

## Arquivos

| Arquivo           | Descrição                                                      |
| ----------------- | -------------------------------------------------------------- |
| `form-footer.tsx` | Componente principal (compound component com `form.Subscribe`) |
| `index.ts`        | Barrel export                                                  |

## Props

| Prop          | Tipo                   | Default      | Descrição                         |
| ------------- | ---------------------- | ------------ | --------------------------------- |
| `form`        | TanStack Form instance | —            | Instância do form para subscrição |
| `onCancel`    | `() => void`           | —            | Callback do botão cancelar        |
| `submitLabel` | `string`               | `"Salvar"`   | Label do botão de submit          |
| `cancelLabel` | `string`               | `"Cancelar"` | Label do botão de cancelar        |

## Padrão de Uso

```tsx
<FormFooter
  form={form}
  onCancel={() => setIsEditing(false)}
  submitLabel="Salvar"
/>
```

- Usa `form.Subscribe` para reagir a `canSubmit` e `isSubmitting`
- Desabilita o botão submit quando `!canSubmit`
- Exibe spinner no submit enquanto `isSubmitting`
- Atributo `data-slot="form-footer"` para hooks de CSS
