# Rich

Componentes de campo pesados com carregamento lazy (React.lazy + Suspense).
Isolados em diretorio separado para evitar impacto no bundle inicial.

## Arquivos

| Arquivo                 | Componente        | Descricao                                                                                                                                           |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field-code-editor.tsx` | `FieldCodeEditor` | Editor Monaco (~76MB) para codigo JavaScript. Valida formato IIFE. Exporta tambem `isValidIIFE`. Recebe `table` e `hook` para contexto do tutorial. |
| `field-editor.tsx`      | `FieldEditor`     | Editor Tiptap rich text. Suporta modo edicao e preview (`ContentViewer`). Configuravel com `defaultMode` e `showPreview`.                           |
| `index.ts`              | -                 | Barrel export                                                                                                                                       |

## Estrategia de lazy loading

Ambos usam `React.lazy` com `Suspense` e skeletons customizados enquanto
carregam:

- `CodeEditorSkeleton` - simula layout do editor de codigo
- `EditorSkeleton` - simula toolbar + area de texto do rich editor

## Dependencias

- `@/components/common/code-editor/code-editor` - Monaco Editor (lazy)
- `@/components/common/rich-editor` - Tiptap Editor e ContentViewer (lazy)
- `@/integrations/tanstack-form/form-context` - `useFieldContext`
