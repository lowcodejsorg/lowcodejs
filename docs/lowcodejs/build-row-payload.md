# Table Row API

Payload para criar/atualizar rows e o formato de resposta da API.

## Tipos de Campo

| Tipo         | Request (payload)                  | Response (API)          | Default |
| ------------ | ---------------------------------- | ----------------------- | ------- |
| TEXT_SHORT   | `string \| null`                   | `string \| null`        | `null`  |
| TEXT_LONG    | `string \| null`                   | `string \| null`        | `null`  |
| DATE         | `string \| null`                   | `string \| null`        | `null`  |
| DROPDOWN     | `string[]`                         | `string[]`              | `[]`    |
| FILE         | `string[]` (IDs)                   | `IStorage[]`            | `[]`    |
| RELATIONSHIP | `string[]` (IDs)                   | `IRow[]`                | `[]`    |
| CATEGORY     | `string[]`                         | `string[]`              | `[]`    |
| USER         | `string[]` (IDs)                   | `IUser[]`               | `[]`    |
| FIELD_GROUP  | `Record<string, RowBasePayload>[]` | `Record<string, any>[]` | `[]`    |

## Request Payload

Formato enviado para criar/atualizar uma row:

```json
{
  "texto-curto": "Lucas",
  "texto-longo": "Lucas",
  "data": "2026-01-05T05:00:00.000Z",
  "drop": ["7a0c6edb-2dc1-4750-9d3e-defa8dd1e5e8"],
  "arquivo": ["697ca2453f98e7c053cb13eb"],
  "relacionamento": ["697740dd97af0330b11bf09a"],
  "categoria": ["740303"],
  "usuario": ["697a21d281e6f3374ea9ae0e"],
  "grupo": [
    {
      "nome": "Lucas",
      "e-mail": "lucas@gmail.com"
    }
  ]
}
```

## Response (API)

Formato retornado pela API ao buscar uma row:

```json
{
  "_id": "697c15ea80758bc70c739a5f",
  "trashed": false,
  "trashedAt": null,
  "createdAt": "2026-01-30T02:22:34.347Z",
  "updatedAt": "2026-01-30T12:21:47.719Z",
  "creator": {
    "_id": "697740a37f1facdec4c63002",
    "name": "master",
    "email": "master@lowcodejs.org"
  },
  "texto-curto": "Lucas",
  "texto-longo": "Lucas",
  "data": "2026-01-05T05:00:00.000Z",
  "drop": ["7a0c6edb-2dc1-4750-9d3e-defa8dd1e5e8"],
  "arquivo": [
    {
      "_id": "697ca2453f98e7c053cb13eb",
      "url": "http://localhost:3000/storage/41030735.jpeg",
      "filename": "41030735.jpeg",
      "type": "image/jpeg",
      "size": 16205,
      "originalName": "67079657.jpeg"
    }
  ],
  "relacionamento": [
    {
      "_id": "697740dd97af0330b11bf09a",
      "nome": "Lucas",
      "e-mail": "lucas@gmail.com"
    }
  ],
  "categoria": ["740303"],
  "usuario": [
    {
      "_id": "697a21d281e6f3374ea9ae0e",
      "name": "Marcos Jhollyfer Felix Rodrigues",
      "email": "jhollyfer.fr@gmail.com"
    }
  ],
  "grupo": [
    {
      "nome": "Lucas",
      "e-mail": "lucas@gmail.com"
    }
  ]
}
```

## Funcoes Relacionadas

- `buildRowPayload(values, fields)` - Converte valores do formulario para o formato de request
- `mountRowValue(value, field)` - Converte um valor individual para o formato de payload
- `buildCreateRowDefaultValues(fields)` - Gera valores default para criacao
- `buildUpdateRowDefaultValues(data, fields)` - Extrai valores de uma row existente para edicao
