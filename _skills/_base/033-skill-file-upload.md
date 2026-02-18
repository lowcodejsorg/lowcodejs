# Skill: File Upload com Storage

O `FileUploadWithStorage` e o padrao para upload de arquivos integrado com a API de storage. O componente estende o `FileUpload` base com upload automatico para `POST /storage`, progress simulado, delete via `DELETE /storage/:id` e callback `onStorageChange` que fornece os IDs dos arquivos armazenados para integracao com formularios. O backend processa imagens convertendo para WebP e redimensionando. O formulario deve aguardar o upload completar antes de permitir submit.

---

## Estrutura do Arquivo

```
frontend/
  src/
    components/
      common/
        file-upload-with-storage.tsx             <-- Componente principal (upload + delete + storage)
      ui/
        file-upload.tsx                          <-- Componente base (drag-drop, validacao)
    lib/
      entities.ts                                <-- IStorage interface

backend/
  application/
    resources/
      storage/
        upload/
          upload.controller.ts                   <-- POST /storage (multipart)
          upload.use-case.ts
        delete/
          delete.controller.ts                   <-- DELETE /storage/:id
          delete.use-case.ts
    services/
      storage/
        local-storage.service.ts                 <-- Conversao WebP + filesystem
  _storage/                                      <-- Diretorio de arquivos (gitignored)
```

---

## Template: Uso em Formulario

```typescript
import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import type { IStorage } from '@/lib/entities';

// No formulario
const [isUploading, setIsUploading] = React.useState(false);

const form = useForm({
  defaultValues: {
    avatar: [] as Array<File>,
    avatar_id: '',
  },
  onSubmit: async ({ value }) => {
    if (isUploading) {
      toast('Aguarde o upload dos arquivos ser concluido');
      return;
    }
    await mutation.mutateAsync({ avatar_id: value.avatar_id });
  },
});

// No JSX (dentro de form.Field)
<form.Field name="avatar">
  {(field) => (
    <FileUploadWithStorage
      value={field.state.value}
      onValueChange={field.handleChange}
      onStorageChange={(storages: Array<IStorage>) => {
        if (storages.length > 0 && storages[0]) {
          form.setFieldValue('avatar_id', storages[0].id);
        } else {
          form.setFieldValue('avatar_id', '');
        }
      }}
      onUploadingChange={setIsUploading}
      accept="image/*"
      maxFiles={1}
      maxSize={2 * 1024 * 1024}
      placeholder="Arraste ou selecione uma foto"
    />
  )}
</form.Field>
```

## Template: Upload Multiplo

```typescript
// Para multiplos arquivos (ex.: imagens de pecas)
const form = useForm({
  defaultValues: {
    images: [] as Array<File>,
    images_id: [] as Array<string>,
  },
  onSubmit: async ({ value }) => {
    if (value.images.length !== value.images_id.length) {
      toast('Aguarde o upload de todas as imagens');
      return;
    }
    await mutation.mutateAsync({ images_id: value.images_id });
  },
});

<FileUploadWithStorage
  value={field.state.value}
  onValueChange={field.handleChange}
  onStorageChange={(storages) => {
    form.setFieldValue('images_id', storages.map((s) => s.id));
  }}
  onUploadingChange={setIsUploading}
  accept="image/*"
  maxFiles={10}
  maxSize={5 * 1024 * 1024}
/>
```

---

## Exemplo Real

```typescript
// routes/_private/administrator/artisans/-components/sheet-create-artisan/form-create-artisan.tsx (trecho)
const [isUploading, setIsUploading] = React.useState(false);

const form = useForm({
  defaultValues: {
    name: '',
    email: '',
    avatar: [],
    avatar_id: '',
    affiliation_proof: [],
    affiliation_proof_id: '',
  },
  validators: { onSubmit: AdministratorArtisanFormSchema },
  onSubmit: async ({ value: data }) => {
    if (isUploading) {
      toast('Aguarde o upload dos arquivos ser concluido');
      return;
    }
    await createUser.mutateAsync({
      name: data.name,
      email: data.email,
      avatar_id: data.avatar_id,
      affiliation_proof_id: data.affiliation_proof_id,
    });
  },
});

// Campo avatar
<form.Field name="avatar">
  {(field) => (
    <Field>
      <FieldLabel>Foto de perfil</FieldLabel>
      <FileUploadWithStorage
        value={field.state.value}
        onValueChange={field.handleChange}
        onStorageChange={(storages) => {
          if (storages.length > 0 && storages[0]) {
            form.setFieldValue('avatar_id', storages[0].id);
          } else {
            form.setFieldValue('avatar_id', '');
          }
        }}
        onUploadingChange={setIsUploading}
        accept="image/*"
        maxFiles={1}
        maxSize={2 * 1024 * 1024}
      />
    </Field>
  )}
</form.Field>
```

**Leitura do exemplo:**

1. O formulario mantem dois campos por arquivo: `avatar` (Array de File para o componente) e `avatar_id` (string para a API).
2. `onStorageChange` recebe o array de `IStorage` apos upload e extrai o `id` para o campo `avatar_id`.
3. `onUploadingChange` atualiza `isUploading` que bloqueia o submit do formulario.
4. O `onSubmit` verifica `isUploading` antes de enviar, mostrando toast se upload nao completou.
5. A API recebe apenas o `avatar_id` (UUID), nao o arquivo. O upload ja foi feito separadamente.

---

## Interface IStorage

```typescript
// lib/entities.ts
export interface IStorage extends Base {
  id: string;
  filename: string;        // "1764539798.webp"
  url: string;            // "http://server/storage/1764539798.webp"
  mimetype: string;       // "image/webp"
  size: number;
  original_name: string;
}
```

---

## Props do FileUploadWithStorage

```typescript
interface FileUploadWithStorageProps {
  value: Array<File>;
  onValueChange: (files: Array<File>) => void;
  onStorageChange: (storages: Array<IStorage>) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  accept?: string;              // MIME types: "image/*", "application/pdf"
  maxFiles?: number;            // Default: 1
  maxSize?: number;             // Default: 5 * 1024 * 1024 (5MB)
  className?: string;
  placeholder?: string;
  defaultValue?: Array<File>;
  shouldDeleteFromStorage?: boolean;  // Default: true
}
```

---

## Fluxo Completo

```
1. Usuario seleciona arquivo (drag-drop ou file picker)
2. FileUpload valida (tipo, tamanho, quantidade)
3. Progress simulado (10 chunks, 100-300ms cada)
4. POST /storage com FormData (multipart/form-data)
5. Backend converte imagem para WebP (sharp), resize 1200px max
6. Backend salva em _storage/ e retorna IStorage[]
7. onStorageChange extrai IDs -> campo do formulario
8. onUploadingChange(false) libera submit
9. Submit envia IDs para a API de negocio
10. (Opcional) Delete: DELETE /storage/{id} remove arquivo
```

---

## Regras e Convencoes

1. **Dois campos por arquivo no form** -- mantenha um campo `Array<File>` (para o componente visual) e um campo `string` ou `Array<string>` (para o ID de storage enviado a API).

2. **Bloquear submit durante upload** -- use `onUploadingChange` para rastrear estado e impedir submit premature com toast informativo.

3. **`onStorageChange` para IDs** -- extraia os IDs dos storages no callback `onStorageChange` e atualize o campo de ID do formulario via `form.setFieldValue`.

4. **Validacao de contagem** -- para uploads multiplos, verifique que `files.length === ids.length` antes do submit.

5. **`accept` especifico** -- sempre defina o tipo de arquivo aceito: `image/*` para imagens, `application/pdf` para PDFs.

6. **`maxSize` em bytes** -- defina limites razoaveis: 2MB para avatares, 5MB para documentos, 10MB para uploads maiores.

7. **`shouldDeleteFromStorage`** -- mantenha `true` (default) para que ao remover um arquivo do componente, ele tambem seja deletado do backend.

8. **Backend converte para WebP** -- imagens sao automaticamente convertidas para WebP com qualidade 80% e max 1200px de largura. Nao e necessario tratar no frontend.

9. **Tratamento de erros** -- erros de upload (codigo 500, `STORAGE_UPLOAD_ERROR`) e delete (404, `STORAGE_NOT_FOUND`) devem exibir toasts especificos.

10. **Nao enviar File para API de negocio** -- a API de negocio recebe apenas o `storage_id` (UUID), nunca o arquivo binario.

---

## Checklist

- [ ] O formulario tem campos separados para `File[]` e `string` (ID).
- [ ] `onStorageChange` extrai IDs e atualiza campo do formulario.
- [ ] `onUploadingChange` bloqueia submit durante upload.
- [ ] `accept` esta definido com MIME type adequado.
- [ ] `maxFiles` e `maxSize` estao configurados.
- [ ] Submit verifica `isUploading` antes de executar.
- [ ] Para uploads multiplos, verifica `files.length === ids.length`.
- [ ] Erro de upload mostra toast com mensagem clara.
- [ ] A API de negocio recebe apenas IDs, nao Files.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Submit envia sem arquivo | `isUploading` nao verificado | Adicionar check `if (isUploading) { toast(); return; }` |
| ID vazio no payload | `onStorageChange` nao extrai ID | Implementar `form.setFieldValue('field_id', storages[0].id)` |
| Upload falha silenciosamente | Faltou tratamento de erro | Verificar `onError` na mutation com toast |
| Arquivo nao deleta do backend | `shouldDeleteFromStorage` e `false` | Manter como `true` (default) |
| Imagem muito grande | `maxSize` nao definido | Configurar `maxSize={bytes}` adequado |
| Upload multiple nao valida | Faltou check de contagem | Verificar `files.length !== ids.length` antes do submit |
| Formato nao aceito | `accept` nao definido | Adicionar `accept="image/*"` ou MIME adequado |

---

**Cross-references:** ver [020-skill-formulario.md](./020-skill-formulario.md), [029-skill-sheet-dialog-crud.md](./029-skill-sheet-dialog-crud.md), [012-skill-service.md](./012-skill-service.md).
