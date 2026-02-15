# Upload Blocking: Prevenindo submit durante upload de arquivos

## Problema

Quando o usuario faz upload de um arquivo, o backend demora para processar (Sharp image processing: 200ms-1000ms). O usuario conseguia clicar no botao de submit antes do backend responder, fazendo com que o storage ID ainda nao existisse e a referencia do arquivo nunca fosse salva no registro.

**Causa raiz:**
1. Em `file-upload-with-storage.tsx`, o `onUpload` simulava progresso fake ate 100%, chamava `onSuccess(file)` (escondendo a barra de progresso), e SO DEPOIS fazia `upload.mutateAsync(files)` (a chamada real ao backend)
2. Botoes de submit nao tinham conhecimento do estado de upload

## Solucao

### 1. Fix de timing do progress bar

O progresso fake agora vai ate ~80% enquanto o upload real acontece. O `onSuccess` so e chamado DEPOIS do `upload.mutateAsync` retornar com sucesso.

### 2. UploadingProvider Context

Context React que rastreia uploads ativos em todo o formulario:

- `UploadingProvider` - wrapper que mantem um `Set<string>` de uploads ativos
- `useUploadingContext()` - retorna o context ou `null` se fora do provider
- `useIsUploading()` - retorna `boolean` (false se fora do provider)

### 3. Auto-registro no FileUploadWithStorage

O componente `FileUploadWithStorage` automaticamente se registra/desregistra no `UploadingProvider` quando detecta que esta dentro de um. Usa `React.useId()` para gerar um ID unico por instancia.

## Como usar em novos formularios

### Passo 1: Envolver o formulario com UploadingProvider

```tsx
import { UploadingProvider, useIsUploading } from '@/components/common/uploading-context';

export function MeuFormulario(props) {
  return (
    <UploadingProvider>
      <MeuFormularioContent {...props} />
    </UploadingProvider>
  );
}
```

### Passo 2: Usar useIsUploading no componente interno

```tsx
function MeuFormularioContent({ ... }) {
  const isUploading = useIsUploading();

  return (
    <>
      {/* campos do formulario com FileUploadWithStorage */}
      <Button
        disabled={!canSubmit || isUploading}
        onClick={() => form.handleSubmit()}
      >
        {isUploading ? 'Enviando...' : 'Salvar'}
      </Button>
    </>
  );
}
```

### Alternativa: Usar onUploadingChange (sem context)

Para casos mais simples (ex: forum composer), use a prop `onUploadingChange` diretamente:

```tsx
const [isUploading, setIsUploading] = useState(false);

<FileUploadWithStorage
  onUploadingChange={setIsUploading}
  // ...outras props
/>

<Button disabled={isUploading}>Enviar</Button>
```

## Formularios integrados

- Create Row Form (`-create-row-form.tsx`)
- Update Row Form (`-update-row-form.tsx`)
- Table Create Form (`tables/create/index.tsx`)
- Settings Form (`settings/index.tsx`)
- Forum Composer (`forum-composer.tsx`)
