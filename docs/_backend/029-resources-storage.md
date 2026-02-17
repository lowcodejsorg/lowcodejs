# Recurso: Storage

O recurso **Storage** gerencia o upload e exclusao de arquivos na aplicacao. Os arquivos sao armazenados localmente no diretorio `_storage/` e servidos estaticamente pelo Fastify.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/storage` | Sim | Upload de arquivo(s) |
| DELETE | `/storage/:_id` | Sim | Deletar arquivo |

> Todos os endpoints requerem autenticacao (`AuthenticationMiddleware` com `optional: false`).

---

## Arquitetura

```
resources/storage/
  update/    # POST /storage (upload)
  delete/    # DELETE /storage/:_id
```

O recurso utiliza dois componentes principais:

- **`StorageContractRepository`**: persistencia dos metadados no MongoDB (modelo `Storage`)
- **`LocalStorageService`**: operacoes no sistema de arquivos (upload, delete, exists)

---

## Upload de Arquivo(s)

**`POST /storage`**

### Formato da Requisicao

O upload utiliza **multipart/form-data**. O controller recebe os arquivos via `request.files()` (iterador assincrono do `@fastify/multipart`):

```
Content-Type: multipart/form-data

file: (arquivo binario)
```

E possivel enviar multiplos arquivos em uma unica requisicao. Cada arquivo e processado individualmente.

### Processamento de Imagens

Imagens dos seguintes tipos MIME passam por processamento automatico via **sharp**:

| MIME Type Aceito |
|-----------------|
| `image/jpeg` |
| `image/png` |
| `image/gif` |
| `image/bmp` |
| `image/tiff` |

O processamento consiste em:

1. **Redimensionamento**: maximo de 1200x1200 pixels (proporcional, sem ampliacao)
2. **Conversao**: formato WebP
3. **Qualidade**: 80%

Arquivos que nao sao imagens (PDFs, documentos, etc.) sao salvos no formato original sem nenhum processamento.

### Nomenclatura de Arquivos

Cada arquivo recebe um nome numerico aleatorio gerado por `Math.floor(Math.random() * 100000000)`, concatenado com a extensao:

- Imagens processadas: `{id-aleatorio}.webp`
- Demais arquivos: `{id-aleatorio}.{extensao-original}`

### Fluxo de Upload

```
1. Recebe multipart file(s) via request.files()
2. Para cada arquivo:
   a. Garante que o diretorio _storage/ existe
   b. Gera nome aleatorio
   c. Se imagem processavel: converte para WebP (sharp: 1200x1200, quality 80%)
   d. Se nao imagem: mantem formato original
   e. Grava no disco em _storage/{filename}
3. Cria registros no modelo Storage (createMany) com metadados
4. Retorna array de registros criados
```

### Resposta de Sucesso (201)

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "filename": "73829145.webp",
    "mimetype": "image/webp",
    "url": "http://localhost:3000/storage/73829145.webp",
    "originalName": "foto-perfil.png",
    "size": 45230,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 500 | STORAGE_UPLOAD_ERROR | Erro no processamento ou gravacao do arquivo |

---

## Deletar Arquivo

**`DELETE /storage/:_id`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `_id` | string | ID do registro Storage |

### Fluxo de Exclusao

```
1. Remove o registro do banco de dados (storageRepository.delete)
2. Se registro nao encontrado, retorna 404
3. Remove o arquivo fisico do disco (_storage/{filename})
4. Retorna confirmacao de exclusao
```

### Resposta de Sucesso (200)

```json
{
  "message": "File deleted successfully",
  "deletedAt": "2025-01-15T10:35:00.000Z"
}
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | STORAGE_NOT_FOUND | Registro de storage nao encontrado |
| 500 | STORAGE_DELETE_ERROR | Erro ao deletar arquivo |

---

## Servico de Arquivos Estaticos

Os arquivos armazenados em `_storage/` sao servidos estaticamente pelo plugin `@fastify/static`, acessiveis pelo prefixo `/storage/`:

```
GET /storage/73829145.webp
```

Este endpoint nao requer autenticacao e serve o arquivo diretamente do disco.

---

## Modelo de Dados (`Storage`)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `_id` | ObjectId | Identificador unico |
| `filename` | string | Nome do arquivo no disco (com ID aleatorio) |
| `mimetype` | string | Tipo MIME do arquivo (ex: `image/webp`) |
| `url` | string | URL completa de acesso ao arquivo |
| `originalName` | string | Nome original do arquivo enviado pelo usuario |
| `size` | number | Tamanho do arquivo em bytes |
| `trashed` | boolean | Se esta na lixeira |
| `createdAt` | Date | Data de criacao |
| `updatedAt` | Date | Data de atualizacao |

---

## LocalStorageService

O servico `LocalStorageService` encapsula todas as operacoes de armazenamento local:

| Metodo | Descricao |
|--------|-----------|
| `upload(part)` | Processa e salva o arquivo em `_storage/`, retorna metadados |
| `delete(filename)` | Remove o arquivo fisico do diretorio |
| `exists(filename)` | Verifica se um arquivo existe no armazenamento |
| `ensureStorageExists()` | Cria o diretorio `_storage/` se nao existir |
