# Storage Service

Servico de armazenamento fisico de arquivos (upload, delete, exists).

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `storage-contract.service.ts` | Classe abstrata com tipo StorageUploadResponse |
| `flydrive-storage.service.ts` | Implementacao com Flydrive (local ou S3) |
| `in-memory-storage.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `upload(part, staticName?)` | `StorageUploadResponse` | Upload de arquivo; imagens convertidas para WebP 1200x1200 |
| `delete(filename)` | `boolean` | Remove arquivo do storage |
| `exists(filename)` | `boolean` | Verifica se arquivo existe |

## Tipos

- `StorageUploadResponse` - filename, mimetype, originalName, size (sem _id, url, timestamps)

## Comportamentos Unicos

- Imagens (jpeg, png, gif, bmp, tiff) sao automaticamente convertidas para WebP com qualidade 80 e redimensionadas para max 1200x1200 (fit inside, sem ampliacao)
- Arquivos nao-imagem sao armazenados sem processamento
- Nome do arquivo gerado aleatoriamente (8 digitos) ou via `staticName`
- Driver configurado em `config/storage.config.ts` (local ou S3 via env STORAGE_DRIVER)
