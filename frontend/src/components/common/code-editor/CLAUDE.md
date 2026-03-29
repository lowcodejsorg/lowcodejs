# Code Editor

Wrapper do Monaco Editor para edicao de scripts JavaScript nos hooks de tabela
(onLoad, beforeSave, afterSave).

## Arquivos

| Arquivo                      | Descricao                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-editor.tsx`            | Componente principal. Renderiza Monaco Editor com label e modal de info. Template IIFE padrao quando vazio                                                                      |
| `code-editor-info-modal.tsx` | Modal com tutorial e documentacao da API sandbox, organizado por abas e tipo de hook                                                                                            |
| `field-type-mapper.ts`       | Mapeia `E_FIELD_TYPE` para tipos TypeScript (ex: TEXT_SHORT -> string, DROPDOWN -> string[]). Gera overloads para `field.get()`/`field.set()` com autocomplete por slug         |
| `sandbox-types.ts`           | Declaracoes de tipos estaticas da API sandbox (FieldApi, ContextApi, EmailApi, UtilsApi etc) injetadas no Monaco                                                                |
| `tutorial-content.ts`        | Conteudo tutorial por tipo de hook (onLoad, beforeSave, afterSave) com exemplos de codigo                                                                                       |
| `use-monaco-types.ts`        | Hook que injeta tipos TypeScript no Monaco: tipos estaticos + tipos dinamicos gerados a partir dos campos da tabela. Registra CompletionItemProvider para autocomplete de slugs |

## Dependencias principais

- `@monaco-editor/react` (Monaco Editor)
- `@/lib/constant` (E_FIELD_TYPE)
- `@/lib/interfaces` (ITable, IField)

## Padroes importantes

- Tipos injetados via `addExtraLib` no Monaco (arquivos virtuais `.d.ts`)
- `HookType = 'onLoad' | 'beforeSave' | 'afterSave'` define o contexto de
  execucao
- Slugs com hifen sao normalizados para underscore (`normalizeSlug`) gerando
  overloads duplicados
- Editor usa linguagem JavaScript com checkJs habilitado para IntelliSense
- Template padrao e uma IIFE async: `(async () => { ... })()`
- Nao tem `index.ts` -- importar diretamente de cada arquivo
