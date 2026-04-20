# Configuracoes do Sistema

Pagina de visualizacao e edicao das configuracoes globais do sistema. Restrita a
usuarios com role MASTER.

## Arquivos

| Arquivo                     | Tipo         | Descricao                                                          |
| --------------------------- | ------------ | ------------------------------------------------------------------ |
| `index.tsx`                 | Route config | `beforeLoad` valida role MASTER, loader carrega `settingOptions()` |
| `index.lazy.tsx`            | Componente   | Alterna entre modo visualizacao e edicao das configuracoes         |
| `-view.tsx`                 | Privado      | Exibe configuracoes em modo somente leitura com cards agrupados    |
| `-update-form.tsx`          | Privado      | Campos do formulario e schema de validacao (`SettingUpdateSchema`) |
| `-update-form-skeleton.tsx` | Privado      | Skeleton exibido durante carregamento                              |

## Configuracoes Disponiveis

| Grupo              | Campos                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Sistema            | `SYSTEM_NAME`, `SYSTEM_DESCRIPTION`, `LOCALE`                                                                         |
| Storage            | `STORAGE_DRIVER`                                                                                                      |
| Logos              | `LOGO_SMALL_URL`, `LOGO_LARGE_URL` (com upload de arquivo)                                                            |
| Upload de arquivos | `FILE_UPLOAD_MAX_SIZE`, `FILE_UPLOAD_MAX_FILES_PER_UPLOAD`, `FILE_UPLOAD_ACCEPTED`                                    |
| Paginacao          | `PAGINATION_PER_PAGE`                                                                                                 |
| Clonagem           | `MODEL_CLONE_TABLES` (tabelas modelo disponiveis para clone)                                                          |
| Email (SMTP)       | `EMAIL_PROVIDER_HOST`, `EMAIL_PROVIDER_PORT`, `EMAIL_PROVIDER_USER`, `EMAIL_PROVIDER_PASSWORD`, `EMAIL_PROVIDER_FROM` |
| IA                 | `OPENAI_API_KEY`, `AI_ASSISTANT_ENABLED`                                                                              |

Todos os campos vivem no documento Setting do MongoDB. O backend aplica defaults
no schema Mongoose — nenhum campo depende de variaveis de ambiente.

## Controle de Acesso

O `beforeLoad` verifica a role no Zustand. Se nao for MASTER, redireciona para
`/tables`.

## Observacoes

- Usa `UploadingProvider` para bloquear submit durante upload de logos
- Erros de campo do backend sao mapeados via `createFieldErrorSetter`
- Role: MASTER
