# Detalhe do Campo

Visualizacao e edicao de um campo existente. Alterna entre modo show e edit.

## Rota

| Rota                           | Descricao               |
| ------------------------------ | ----------------------- |
| `/tables/:slug/field/:fieldId` | Visualizar/editar campo |

## Search Params

| Param   | Tipo              | Descricao                              |
| ------- | ----------------- | -------------------------------------- |
| `group` | string (opcional) | Slug do grupo ao qual o campo pertence |

## Arquivos

| Arquivo            | Tipo       | Descricao                                                                    |
| ------------------ | ---------- | ---------------------------------------------------------------------------- |
| `index.tsx`        | Loader     | Carrega tableDetail + fieldDetail (ou groupFieldDetail se `group` presente)  |
| `index.lazy.tsx`   | Componente | Layout com modos show/edit, logica de atualizacao e envio para lixeira       |
| `-view.tsx`        | Componente | Visualizacao somente-leitura: tipo, formato, dropdown, relacionamento, flags |
| `-update-form.tsx` | Formulario | Schema `FieldUpdateSchema` similar ao create, com campo `trashed` adicional  |

## Fluxo

1. Verifica permissao `UPDATE_FIELD`
2. Modo show: exibe dados do campo + botao Editar (se nao trashed e nao locked)
3. Modo edit: formulario com mesmos campos do create + flag `trashed`
4. Campos locked: somente tipo DROPDOWN permite edicao parcial
5. Submissao: PUT `/tables/:slug/fields/:fieldId` ou `useGroupFieldUpdate` para
   contexto de grupo
6. Cache: atualiza queryData de field, table e table list apos sucesso

## Tratamento de Lixeira

- Campo `trashed` no formulario permite enviar/restaurar campo da lixeira
- Mensagens de toast diferenciadas para trash/restore/update
