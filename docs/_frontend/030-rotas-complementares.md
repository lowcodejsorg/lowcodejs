# Rotas Complementares

Este documento detalha as rotas complementares do sistema: paginas dinamicas, perfil do usuario, configuracoes do sistema e ferramentas.

**Diretorio base:** `frontend/src/routes/_private/`

---

## Paginas Dinamicas

**Arquivo:** `pages/$slug.tsx`
**Rota:** `/_private/pages/$slug`

Rota para exibicao de paginas HTML dinamicas gerenciadas pelo sistema.

### Funcionamento

Utiliza o hook `usePageRead({ slug })` para buscar os dados da pagina e renderiza o conteudo HTML diretamente:

```typescript
function RouteComponent(): React.JSX.Element {
  const { slug } = useParams({
    from: '/_private/pages/$slug',
  });

  const page = usePageRead({ slug });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 p-2 flex flex-row justify-between gap-1 border-b">
        <h1 className="text-2xl font-medium">{page.data?.name ?? ''}</h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <div
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: page.data?.html ?? '' }}
        />
      </div>
    </div>
  );
}
```

### Estrutura da Pagina

| Secao     | Descricao                                          |
|-----------|-----------------------------------------------------|
| Header    | Nome da pagina (`page.data.name`)                   |
| Conteudo  | HTML renderizado com classes Tailwind Typography     |

### Estilizacao

O conteudo HTML e renderizado com as classes `prose dark:prose-invert` do plugin Tailwind Typography, garantindo formatacao consistente para elementos HTML como headings, paragrafos, listas e links.

---

## Perfil do Usuario

**Arquivos:**
- `profile/index.tsx` - Rota e orquestracao
- `profile/-view.tsx` - Visualizacao somente-leitura
- `profile/-update-form.tsx` - Formulario de edicao
- `profile/-update-form-skeleton.tsx` - Skeleton de carregamento

**Rota:** `/_private/profile/`

### Modo Visualizacao

Exibe os dados do usuario em modo somente-leitura via componente `ProfileView`. Inclui botao "Editar" no cabecalho.

### Modo Edicao

Formulario com os seguintes campos:

| Campo              | Componente       | Descricao                          |
|--------------------|------------------|------------------------------------|
| `name`             | `FieldText`      | Nome do usuario                    |
| `email`            | `FieldText`      | E-mail do usuario                  |
| `currentPassword`  | `FieldText`      | Senha atual (se alterando senha)   |
| `newPassword`      | `FieldText`      | Nova senha                         |
| `confirmPassword`  | `FieldText`      | Confirmacao da nova senha          |

### Alteracao de Senha

A alteracao de senha e opcional e controlada por um toggle `allowPasswordChange`:

```typescript
const [allowPasswordChange, setAllowPasswordChange] = React.useState(false);

// No submit:
if (allowPasswordChange && value.newPassword !== value.confirmPassword) {
  toast('As senhas nao coincidem', {
    className: '!bg-destructive !text-white !border-destructive',
    description: 'A nova senha e a confirmacao devem ser iguais',
    descriptionClassName: '!text-white',
    closeButton: true,
  });
  return;
}

const payload = {
  name: value.name.trim(),
  email: value.email.trim(),
  allowPasswordChange,
};

if (allowPasswordChange) {
  payload.currentPassword = value.currentPassword.trim();
  payload.newPassword = value.newPassword.trim();
}
```

### Informacoes de Grupo

Os dados do grupo (`data.group`) sao exibidos em modo somente-leitura no formulario de edicao.

### Hooks Utilizados

| Hook              | Descricao                          |
|-------------------|------------------------------------|
| `useProfileRead`  | Busca dados do perfil              |
| `useUpdateProfile`| Atualiza dados do perfil           |

### Tratamento de Erros

Erros de atualizacao sao exibidos via toast com a mensagem retornada pelo servidor:

```typescript
onError(error) {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data;
    toast('Erro ao atualizar o perfil', {
      className: '!bg-destructive !text-white !border-destructive',
      description: errorData?.message ?? 'Erro ao atualizar o perfil',
      descriptionClassName: '!text-white',
      closeButton: true,
    });
  }
}
```

---

## Configuracoes do Sistema

**Arquivos:**
- `settings/index.tsx` - Rota e orquestracao
- `settings/-update-form.tsx` - Formulario de edicao
- `settings/-update-form-skeleton.tsx` - Skeleton de carregamento
- `settings/-view.tsx` - Visualizacao somente-leitura

**Rota:** `/_private/settings/`

### Restricao de Acesso

Esta rota e acessivel apenas para usuarios com papel `MASTER`. Demais usuarios nao visualizam esta opcao no menu.

### Campos de Configuracao

Os campos estao organizados em secoes (Cards):

#### Localizacao

| Campo    | Tipo     | Descricao                  |
|----------|----------|----------------------------|
| `LOCALE` | `string` | Idioma do sistema          |

#### Logos

| Campo            | Tipo     | Descricao                       |
|------------------|----------|---------------------------------|
| `LOGO_SMALL_URL` | `string` | URL do logo pequeno (sidebar)   |
| `LOGO_LARGE_URL` | `string` | URL do logo grande (login)      |
| `logoSmallFile`  | `File[]` | Upload de novo logo pequeno     |
| `logoLargeFile`  | `File[]` | Upload de novo logo grande      |

#### Upload de Arquivos

| Campo                            | Tipo     | Descricao                          |
|----------------------------------|----------|------------------------------------|
| `FILE_UPLOAD_MAX_SIZE`           | `number` | Tamanho maximo de arquivo (bytes)  |
| `FILE_UPLOAD_MAX_FILES_PER_UPLOAD`| `number`| Maximo de arquivos por upload      |
| `FILE_UPLOAD_ACCEPTED`           | `string` | Tipos aceitos (separados por `;`)  |

#### Paginacao

| Campo               | Tipo     | Descricao                    |
|---------------------|----------|------------------------------|
| `PAGINATION_PER_PAGE`| `number`| Registros por pagina padrao  |

#### Modelos de Clonagem

| Campo               | Tipo       | Descricao                              |
|---------------------|------------|----------------------------------------|
| `MODEL_CLONE_TABLES`| `string[]` | IDs das tabelas disponiveis como modelo|

#### Provedor de E-mail

| Campo                   | Tipo     | Descricao                    |
|-------------------------|----------|------------------------------|
| `EMAIL_PROVIDER_HOST`   | `string` | Host do servidor SMTP        |
| `EMAIL_PROVIDER_PORT`   | `number` | Porta do servidor SMTP       |
| `EMAIL_PROVIDER_USER`   | `string` | Usuario SMTP                 |
| `EMAIL_PROVIDER_PASSWORD`| `string`| Senha SMTP                   |

### Schema de Validacao

```typescript
export const SettingUpdateSchema = z.object({
  LOCALE: z.string().min(1),
  LOGO_SMALL_URL: z.string().nullable(),
  LOGO_LARGE_URL: z.string().nullable(),
  FILE_UPLOAD_MAX_SIZE: z.string(),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.string(),
  FILE_UPLOAD_ACCEPTED: z.string(),
  PAGINATION_PER_PAGE: z.string(),
  MODEL_CLONE_TABLES: z.array(z.string()),
  EMAIL_PROVIDER_HOST: z.string(),
  EMAIL_PROVIDER_PORT: z.string(),
  EMAIL_PROVIDER_USER: z.string(),
  EMAIL_PROVIDER_PASSWORD: z.string(),
});
```

### Construcao do Payload

Os valores sao convertidos para os tipos corretos antes do envio:

```typescript
const payload = {
  LOCALE: value.LOCALE.trim(),
  LOGO_SMALL_URL: value.LOGO_SMALL_URL ?? undefined,
  LOGO_LARGE_URL: value.LOGO_LARGE_URL ?? undefined,
  FILE_UPLOAD_MAX_SIZE: Number(value.FILE_UPLOAD_MAX_SIZE),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: Number(value.FILE_UPLOAD_MAX_FILES_PER_UPLOAD),
  FILE_UPLOAD_ACCEPTED: value.FILE_UPLOAD_ACCEPTED.split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(';'),
  PAGINATION_PER_PAGE: Number(value.PAGINATION_PER_PAGE),
  MODEL_CLONE_TABLES: value.MODEL_CLONE_TABLES,
  EMAIL_PROVIDER_HOST: value.EMAIL_PROVIDER_HOST.trim(),
  EMAIL_PROVIDER_PORT: Number(value.EMAIL_PROVIDER_PORT),
  EMAIL_PROVIDER_USER: value.EMAIL_PROVIDER_USER.trim(),
  EMAIL_PROVIDER_PASSWORD: value.EMAIL_PROVIDER_PASSWORD.trim(),
};
```

### Tratamento de Erros

| Codigo | Causa                                           | Acao                                    |
|--------|--------------------------------------------------|-----------------------------------------|
| `404`  | `SETTINGS_FILE_NOT_FOUND`                       | Toast "Configuracoes nao encontradas"   |
| `400`  | `INVALID_PAYLOAD_FORMAT` / `VALIDATION_ERROR`   | Erros inline por campo                  |
| `500`  | `SETTINGS_UPDATE_ERROR` / `FILE_WRITE_ERROR`    | Toast de erro generico                  |

Os erros de validacao sao aplicados campo a campo via `setFieldError`:

```typescript
function setFieldError(
  field: 'LOCALE' | 'LOGO_SMALL_URL' | 'LOGO_LARGE_URL' | /* ... */,
  message: string,
): void {
  form.setFieldMeta(field, (prev) => ({
    ...prev,
    isTouched: true,
    errors: [{ message }],
    errorMap: { onSubmit: { message } },
  }));
}
```

### Hooks Utilizados

| Hook              | Descricao                             |
|-------------------|---------------------------------------|
| `useSettingRead`  | Busca configuracoes do sistema        |
| `useUpdateSetting`| Atualiza configuracoes do sistema     |

---

## Ferramentas do Sistema

**Arquivo:** `tools/index.tsx`
**Rota:** `/_private/tools/`

Pagina de ferramentas utilitarias. Atualmente possui uma unica ferramenta: clonagem de tabelas.

### Permissoes

Requer permissao `CREATE_TABLE`. Exibe `AccessDenied` se o usuario nao possuir a permissao.

### Ferramenta: Clonar Modelos de Tabela

Permite criar uma nova tabela a partir de qualquer tabela existente no sistema (diferente da rota `/tables/clone` que utiliza apenas modelos configurados).

#### Campos

| Campo          | Componente                | Descricao                          |
|----------------|---------------------------|------------------------------------|
| Modelo base    | `TableComboboxPaginated`  | Combobox paginado de tabelas       |
| Nome           | `InputGroupInput`         | Nome da nova tabela                |

#### TableComboboxPaginated

Combobox com busca e paginacao para selecao de tabela modelo. Busca tabelas do sistema de forma paginada conforme o usuario digita.

#### Fluxo

1. Usuario seleciona tabela modelo via combobox paginado
2. Usuario define o nome da nova tabela
3. Ao clicar "Clonar Modelo", `useCloneTable` envia requisicao
4. Em caso de sucesso: toast verde, campos resetados, navega para a nova tabela
5. Em caso de erro: toast com mensagem especifica

#### Tratamento de Erros

```typescript
onError(error) {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as IHTTPExeptionError<{
      name?: string;
      baseTableId?: string;
    }>;

    if (errorData.cause === 'TABLE_NOT_FOUND' && errorData.code === 404) {
      toast('Modelo nao encontrado', { /* ... */ });
      return;
    }

    toast('Erro ao clonar tabela', {
      description: errorData.message || 'Erro ao clonar a tabela',
    });
  }
}
```

---

## Padroes Compartilhados

### Padrao Show/Edit Mode

As rotas de Perfil e Configuracoes utilizam o mesmo padrao de alternancia de modo:

```typescript
const [mode, setMode] = React.useState<'show' | 'edit'>('show');
```

- **Modo Show**: Exibe dados em somente-leitura com botao "Editar"
- **Modo Edit**: Exibe formulario com botoes "Cancelar" e "Salvar"

### Padrao de Footer com Form.Subscribe

Botoes de acao no footer utilizam `form.Subscribe` para reatividade:

```typescript
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isSubmitting]}
  children={([canSubmit, isSubmitting]) => (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        disabled={isSubmitting}
        onClick={() => { form.reset(); setMode('show'); }}
      >
        Cancelar
      </Button>
      <Button
        disabled={!canSubmit || isUploading}
        onClick={() => form.handleSubmit()}
      >
        {isSubmitting && <Spinner />}
        Salvar
      </Button>
    </div>
  )}
/>
```

### Padrao de Tratamento de Erros HTTP

Todas as rotas complementares seguem o mesmo padrao de tratamento:

1. Verificar se erro e instancia de `AxiosError`
2. Extrair `errorData` do `error.response?.data`
3. Tratar por `cause` e `code` especificos
4. Fallback com toast generico

### UploadingProvider

As rotas de Configuracoes e Perfil (quando possuem upload) utilizam `UploadingProvider` para rastrear uploads em andamento e desabilitar o botao de submit:

```typescript
<UploadingProvider>
  <ComponenteComFormulario />
</UploadingProvider>

// No componente:
const isUploading = useIsUploading();

// No botao:
<Button disabled={!canSubmit || isUploading}>
  Salvar
</Button>
```

---

## Resumo das Rotas

| Rota                    | Descricao                    | Permissao Necessaria |
|-------------------------|------------------------------|----------------------|
| `/pages/$slug`          | Pagina HTML dinamica         | Autenticado          |
| `/profile/`             | Perfil do usuario            | Autenticado          |
| `/settings/`            | Configuracoes do sistema     | MASTER               |
| `/tools/`               | Ferramentas do sistema       | CREATE_TABLE         |
