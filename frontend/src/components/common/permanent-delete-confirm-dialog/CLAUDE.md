# Permanent Delete Confirm Dialog

Dialog destrutivo que exige resposta correta a um cálculo matemático simples
(soma ou subtração de números 1–9) antes de habilitar o botão de confirmação.

## Responsabilidade

Confirmar exclusões irreversíveis de forma humana — protege contra cliques
acidentais. **Não é um anti-bot**: o cálculo é trivial.

## Arquivos

| Arquivo                              | Descrição                                  |
| ------------------------------------ | ------------------------------------------ |
| `permanent-delete-confirm-dialog.tsx`| Componente Dialog com captcha + warning    |
| `use-math-captcha.ts`                | Hook que gera pergunta/resposta + reseta   |
| `index.ts`                           | Barrel                                     |

## Props

```ts
type PermanentDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemsCount: number;        // mostra "N itens serão excluídos"
  isPending: boolean;        // disable do botão durante mutation
  onConfirm: () => void;     // disparado quando captcha válido + clique
  confirmLabel?: string;     // default "Excluir permanentemente"
  testId?: string;
};
```

## Padrões aplicados

- Sem `any`, sem `as Tipo` (apenas `as const` no factory de operações).
- Sem ternários — Object mapper para gerar operação e renderização condicional
  via `{cond && <X/>}`.
- Mensagens em PT-BR.

## Casos de uso

- Singular: `itemsCount={1}` para hard delete de um item.
- Bulk: `itemsCount={selectedCount}`.
- Empty trash: `itemsCount={trashedTotal}`.
