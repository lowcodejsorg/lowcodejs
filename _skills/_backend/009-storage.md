# Armazenamento de Arquivos (`_storage/`)

O diretorio `_storage/` e o local fisico onde os arquivos enviados pelos usuarios sao armazenados no servidor. O backend serve esses arquivos estaticamente e gerencia todo o ciclo de vida dos uploads.

## Estrutura

```
backend/
  _storage/          # Diretorio fisico dos arquivos
```

## Servico de Arquivos Estaticos

Os arquivos armazenados em `_storage/` sao servidos estaticamente pelo plugin `@fastify/static`, acessiveis pelo prefixo `/storage/`.

Exemplo de acesso:

```
GET /storage/8374621095.webp
```

## Nomenclatura de Arquivos

Cada arquivo enviado recebe um **ID numerico aleatorio** como nome, mantendo a extensao original (ou `.webp` no caso de imagens convertidas). Isso evita conflitos de nome e exposicao do nome original do arquivo.

Exemplo: um upload de `foto-perfil.png` pode ser salvo como `7291843056.webp`.

## Processamento de Imagens

Arquivos de imagem passam por processamento automatico utilizando a biblioteca **sharp**:

- **Formato:** convertidos automaticamente para **WebP**
- **Qualidade:** 80%
- **Dimensoes maximas:** 1200x1200 pixels (redimensionamento proporcional)

Arquivos que nao sao imagens sao armazenados no formato original, sem nenhum processamento.

## LocalStorageService

O servico `LocalStorageService` e responsavel por todas as operacoes de armazenamento local:

| Operacao  | Descricao                                                  |
|-----------|------------------------------------------------------------|
| `upload`  | Salva o arquivo em `_storage/`, processando imagens        |
| `delete`  | Remove o arquivo fisico do diretorio                       |
| `exists`  | Verifica se um arquivo existe no armazenamento             |

## Modelo Storage

O sistema mantem um modelo (Mongoose) para rastrear metadados de cada arquivo armazenado:

| Campo          | Descricao                                    |
|----------------|----------------------------------------------|
| `url`          | URL de acesso ao arquivo (ex: `/storage/...`)|
| `filename`     | Nome do arquivo no disco (com ID aleatorio)  |
| `mimetype`     | Tipo MIME do arquivo (ex: `image/webp`)      |
| `originalName` | Nome original do arquivo enviado pelo usuario|
| `size`         | Tamanho do arquivo em bytes                  |

## Fluxo de Upload

1. O usuario envia um arquivo via multipart form.
2. O `LocalStorageService` gera um ID numerico aleatorio para o nome do arquivo.
3. Se for uma imagem, o **sharp** converte para WebP (80% de qualidade, max 1200x1200).
4. Se nao for imagem, o arquivo e salvo como esta.
5. O arquivo e gravado no diretorio `_storage/`.
6. Os metadados sao persistidos no modelo `Storage` via Mongoose.
7. A URL de acesso e retornada ao cliente.
