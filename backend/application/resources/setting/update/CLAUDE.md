# Update Setting

Atualiza as configuracoes globais da plataforma.

## Endpoint
`PUT /setting` | Auth: Yes | Permission: nenhuma especifica

## Fluxo
1. Middleware: AuthenticationMiddleware (obrigatorio)
2. Validator: SettingUpdateBodyValidator - campos: SYSTEM_NAME (string, required, max 100), LOCALE (enum pt-br/en-us), STORAGE_DRIVER (enum local/s3, optional), FILE_UPLOAD_MAX_SIZE (number, min 1), FILE_UPLOAD_ACCEPTED (string, min 1), FILE_UPLOAD_MAX_FILES_PER_UPLOAD (number, min 1), PAGINATION_PER_PAGE (number, min 1), MODEL_CLONE_TABLES (array de strings, optional), EMAIL_PROVIDER_HOST/PORT/USER/PASSWORD/FROM (nullable+optional — fonte unica das credenciais SMTP), LOGO_SMALL_URL (string, nullable, optional), LOGO_LARGE_URL (string, nullable, optional)
3. UseCase:
   - Filtra MODEL_CLONE_TABLES removendo IDs de templates built-in e IDs invalidos (nao ObjectId)
   - Atualiza settings via settingRepository.update
   - Sincroniza cada chave/valor com process.env (exceto EMAIL_PROVIDER_* e valores null/undefined)
   - Retorna settings atualizado com FILE_UPLOAD_ACCEPTED splitado
4. Repository: SettingContractRepository (update)

## Regras de Negocio
- Todos os campos de configuracao sao enviados (PUT completo)
- Templates built-in (KANBAN_TEMPLATE, CARDS_TEMPLATE, MOSAIC_TEMPLATE, DOCUMENT_TEMPLATE) sao filtrados do MODEL_CLONE_TABLES
- Somente ObjectIds validos sao mantidos em MODEL_CLONE_TABLES
- Apos update, os valores sao sincronizados com process.env (efeito em runtime)

## Erros Possiveis
| Code | Cause | Quando |
|------|-------|--------|
| 500 | SETTINGS_UPDATE_ERROR | Erro ao atualizar configuracoes |

## Testes
- Unit: `update.use-case.spec.ts`
- E2E: `update.controller.spec.ts`
