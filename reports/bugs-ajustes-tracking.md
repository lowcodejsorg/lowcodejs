# LowCodeJS - Rastreamento de Erros, Ajustes e Melhorias

> Documento gerado em: 17/02/2026
> Branch: `develop`

---

## Legenda de Status

| Status | Descricao |
|--------|-----------|
| Realizado | Corrigido/ajustado e enviado para nova rodada de testes |
| Em Andamento | Correção em progresso |
| A Fazer | Pendente de implementacao |
| Proximo | Ajustes e melhorias planejadas |
| Descartado | Item descartado |

## Legenda de Tipo

| Tipo | Descricao |
|------|-----------|
| Erro | Requisito nao funciona e/ou gera tela de erro |
| Ajuste | Pequena alteracao em funcionalidade existente |
| Correcao | Reteste apos correcao |
| Melhoria | Nova funcionalidade |

---

## Resumo Geral

| Categoria | Total |
|-----------|-------|
| Realizado | 11 |
| Em Andamento | 5 |
| A Fazer (Erros) | 4 |
| Proximo (Ajustes/Melhorias) | 14 |
| Descartado | - |

---

## 1. REALIZADO (Corrigido - Em Reteste)

### 1.1 Erro ao logar com espaco extra no email

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Jan 2026 |
| **Corrigido em** | ~Jan 2026 |
| **Responsavel** | - |

**Descricao:** Se o usuario digita um espaco a mais no email, o sistema nao avisa que o erro e esse e nao permite o login.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/authentication/sign-in/sign-in.use-case.ts` | Validacao de email no sign-in |
| Backend | `application/core/entity.core.ts` | Schema de validacao (trim no email) |
| Frontend | `src/routes/_authentication/sign-in/` | Formulario de login |
| Frontend | `src/lib/schemas.ts` | `SignInBodySchema` - validacao Zod com `.trim()` |

**Skills relacionadas:** `_base/003-skill-validator.md`, `_base/024-skill-schema-zod.md`, `_backend/019-resources-authentication.md`

---

### 1.2 Erro de validacao no formulario de campos (botao desabilitado)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 28/01/2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Na manutencao dos campos de uma tabela, ao esquecer de preencher um valor obrigatorio, o formulario valida e exibe a mensagem, mas apos informar o valor, o botao "Criar" continua desabilitado.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/create/-create-form.tsx` | Formulario de criacao de campo |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx` | Formulario de atualizacao de campo |
| Frontend | `src/integrations/tanstack-form/` | Hook de formulario e estado de validacao |

**Skills relacionadas:** `_base/020-skill-formulario.md`, `_base/003-skill-validator.md`, `_frontend/015-formularios.md`

---

### 1.3 Erro no modelo de documento (campos nativos)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Jan 2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Campos nativos (_id, creator, createdAt, trashed, trashedAt) causavam erro no modelo de visualizacao Documento.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/entity.core.ts` | Definicao de `FIELD_NATIVE_LIST` e tipos nativos |
| Frontend | `src/routes/_private/tables/$slug/` | Componentes de visualizacao de tabela (documento) |
| Frontend | `src/components/common/` | Componentes de renderizacao de campos |

**Skills relacionadas:** `_base/008-skill-model.md`, `_frontend/016-componentes-comuns.md`

---

### 1.4 Erro no modelo kanban (campos nativos)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Jan 2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Campos nativos causavam erro no modelo de visualizacao Kanban.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/components/kanban/` | 12 componentes kanban (@dnd-kit) |
| Frontend | `src/lib/kanban-helpers.ts` | Helpers de mapeamento kanban |
| Backend | `application/core/entity.core.ts` | Definicao de campos nativos |

**Skills relacionadas:** `_frontend/018-componentes-kanban.md`, `_base/008-skill-model.md`

---

### 1.5 Nao foi possivel alterar o logo

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 11/02/2026 |
| **Corrigido em** | 11/02/2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** A definicao de templates possuir ID (constante) nao valido no mongoose acarretou na invalidacao de dados enviados para a rota da API. Solucao: ignorar os IDs dos TEMPLATES e enviar apenas IDs de modelos persistidos na base de dados.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/model/setting.model.ts` | Schema de settings com `MODEL_CLONE_TABLES` (ObjectId ref) |
| Backend | `application/resources/setting/update/` | Use-case de update do setting |
| Frontend | `src/routes/_private/settings/` | Pagina de configuracoes |

**Skills relacionadas:** `_backend/031-resources-setting.md`, `_base/004-skill-schema-api.md`

---

### 1.6 Campos nativos com controle de visibilidade/ordenacao

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Jan 2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Campos nativos estavam aparecendo sem controle. Adicionado controle de visibilidade e ordenacao para campos nativos.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/management.tsx` | Gerenciamento de campos (filtra `!f.native` na linha 77) |
| Frontend | `src/routes/_private/tables/$slug/field/-field-order-form.tsx` | Formulario de ordenacao de campos |
| Backend | `application/model/field.model.ts` | Flag `native` e `locked` nos campos |

**Skills relacionadas:** `_backend/025-resources-table-fields.md`, `_frontend/027-rotas-tabelas-campos.md`

---

### 1.7 Padrao para importar dados (Row API)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 27/01/2026 |
| **Corrigido em** | 31/01/2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Dados importados diretamente no banco nao seguiam o padrao valido da API. Ao tentar alterar, retornava erro. Corrigido com mapeamento de payload request/response e documentacao da Row API.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/row-payload-validator.core.ts` | Validacao de payload de registros |
| Backend | `application/resources/table-rows/create/` | Use-case de criacao de row |
| Backend | `application/resources/table-rows/update/` | Use-case de update de row |
| Docs | `docs/core/build-row-payload.md` | Documentacao gerada sobre payload de rows |

**Skills relacionadas:** `_backend/026-resources-table-rows.md`, `_base/003-skill-validator.md`

---

### 1.8 Relacionamento bidirecional

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | 28/01/2026 |
| **Corrigido em** | 10/02/2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** O endpoint de bairros trazia dados do municipio relacionado, mas a tabela de municipios nao trazia dados de bairros. Adicionada logica de virtual reverse populate para trazer dados bidirecionais de um relacionamento.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/util.core.ts` | Schema building com virtual fields e reverse populate |
| Backend | `application/model/field.model.ts` | Configuracao de `relationship` no campo |
| Backend | `application/repositories/table/` | Repository com populate de relacionamentos |
| Backend | `application/resources/table-rows/paginated/` | Listagem paginada com populate bidirecional |

**Skills relacionadas:** `_backend/026-resources-table-rows.md`, `_base/009-skill-repository.md`

---

### 1.9 Erro ao definir imagem no projeto (botao salvar desabilitado)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 02/02/2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Ao definir nova imagem no projeto e salvar, informava que deveria selecionar tabela modelo. Apos selecionar, o botao salvar nao era desabilitado e nao permitia persistir os dados.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/settings/` | Formulario de configuracoes |
| Frontend | `src/lib/schemas.ts` | `SettingUpdateBodySchema` |
| Backend | `application/resources/setting/update/` | Validacao do update de settings |

**Skills relacionadas:** `_backend/031-resources-setting.md`, `_base/020-skill-formulario.md`

---

### 1.10 Ajustes no design conforme especificacao

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Jan 2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | Jhollyfer |

**Descricao:** Multiplos ajustes de design: tabelas em sistema, editar em detalhes, largura e visibilidade do campo para lista/form/detalhes, checkbox para excluir multiplas linhas com selecao multipla via shift, campos nativos embutidos (ID, Created-by, Created-date) para grupos de campos.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/` | Componentes de tabela (lista, form, detalhes) |
| Frontend | `src/routes/_private/tables/$slug/field/` | Gerenciamento de campos |
| Backend | `application/model/field.model.ts` | Flags `showInList`, `showInForm`, `showInDetail`, `widthInForm`, `widthInList` |

**Skills relacionadas:** `_frontend/026-rotas-tabelas-base.md`, `_frontend/027-rotas-tabelas-campos.md`

---

### 1.11 Salvar metodo em tabela + criptografia

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 04/02/2026 |
| **Corrigido em** | ~Fev 2026 |
| **Responsavel** | - |

**Descricao:** Erro ao salvar metodo dentro de uma tabela. Tambem solicitado uso de CryptoJS para criptografia de senhas.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/table-base/update/` | Update de tabela com methods (beforeSave, afterSave, onLoad) |
| Backend | `application/model/table.model.ts` | Schema de methods na tabela |
| Frontend | `src/components/code-editor/` | Monaco Editor para methods |

**Skills relacionadas:** `_backend/024-resources-table-base.md`, `_base/002-skill-controller.md`

---

## 2. EM ANDAMENTO

### 2.1 Nao esta salvando o arquivo do campo arquivo

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] Jhollyfer |
| **Status** | Em reteste |

**Descricao:** Arquivo nao salva na primeira criacao do registro. Apos salvar e em seguida editar o registro e enviar o arquivo, ele salva. Correcao: adicionado bloqueio dos botoes de formulario enquanto a API retorna a resposta do upload.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/services/storage.service.ts` | Servico de upload (Sharp para imagens, max 5MB) |
| Backend | `application/resources/storage/upload/` | Controller de upload |
| Backend | `application/resources/table-rows/create/` | Criacao de row com campo FILE |
| Frontend | `src/routes/_private/tables/$slug/row/` | Formulario de criacao/edicao de registro |
| Frontend | `src/hooks/tanstack-query/` | Hook de mutation para upload |
| Frontend | `src/components/common/` | Componente de upload de arquivo |

**Skills relacionadas:** `_base/033-skill-file-upload.md`, `_backend/029-resources-storage.md`, `_base/018-skill-hook-mutation.md`

---

### 2.2 Dropdown no grupo de campos com erro

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | - |
| **Status** | Investigando |

**Descricao:** Nao e possivel usar dropdown em um grupo de campos. O botao de criar nao habilita.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/model/field.model.ts` | Schema de campo com `dropdown` + `group` |
| Backend | `application/resources/table-fields/create/` | Validacao de campo dentro de grupo |
| Frontend | `src/routes/_private/tables/$slug/field/create/-create-form.tsx` | Formulario de criacao com tipo DROPDOWN |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx` | Schema `FieldUpdateSchema` com dropdown options |
| Frontend | `src/lib/schemas.ts` | `FieldCreateBodySchema` e `FieldUpdateBodySchema` |

**Skills relacionadas:** `_base/020-skill-formulario.md`, `_backend/025-resources-table-fields.md`

---

### 2.3 Erro na tabela Inicio (todos os campos criados)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | - |
| **Status** | Investigando (simular local) |

**Descricao:** Erro apos registro criado em tabela que possui todos os tipos de campos. Provavelmente relacionado ao schema building dinamico com todos os tipos.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/util.core.ts` | `buildSchemaFromFields()` - schema building dinamico |
| Backend | `application/core/row-payload-validator.core.ts` | Validacao de todos os tipos de campo |
| Backend | `application/resources/table-rows/create/` | Criacao de registro |
| Frontend | `src/routes/_private/tables/$slug/row/` | Renderizacao de formulario com todos os tipos |

**Skills relacionadas:** `_base/008-skill-model.md`, `_backend/026-resources-table-rows.md`

---

### 2.4 Validacao nao desaparece / Dropdown salvo sem opcoes

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | - |
| **Status** | Investigando |

**Descricao:** (1) Validacao nao desaparece mesmo depois de atender o requisito. (2) Campo dropdown pode ser salvo sem opcoes configuradas.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/create/-create-form.tsx` | Estado de validacao do formulario |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx` | `FieldUpdateSchema` - dropdown sem validacao de min items |
| Frontend | `src/integrations/tanstack-form/` | TanStack Form hook e re-validacao |
| Backend | `application/resources/table-fields/create/` | Validacao do campo dropdown (aceita array vazio) |
| Frontend | `src/lib/schemas.ts` | `FieldCreateBodySchema` - `dropdown: z.array(DropdownSchema).default([])` |

**Skills relacionadas:** `_base/003-skill-validator.md`, `_base/020-skill-formulario.md`

---

### 2.5 Colocar coluna Modelo em Tabelas

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Report** | - |
| **Status** | Pendente |

**Descricao:** Mostrar o modelo (style) de cada tabela na listagem de tabelas.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/` | Listagem de tabelas (paginated) |
| Backend | `application/model/table.model.ts` | Campo `style` (LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM) |
| Backend | `application/resources/table-base/paginated/` | Retorno da listagem |

**Skills relacionadas:** `_frontend/026-rotas-tabelas-base.md`, `_base/028-skill-tabela-paginada.md`

---

## 3. A FAZER (ERROS)

### 3.1 Erro ao logar pelo Chrome

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** Cache utilizava cookies anteriores e nao permitia a autenticacao correta do usuario. Criada camada de verificacao extra no backend para lidar com cache de cookies.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/middlewares/authentication.middleware.ts` | Verificacao de JWT e cookies |
| Backend | `application/utils/cookies.util.ts` | Extracao de cookies com fallback |
| Backend | `application/utils/jwt.util.ts` | Verificacao de tokens RS256 |
| Backend | `application/resources/authentication/sign-in/` | Fluxo de login |
| Frontend | `src/stores/authentication.ts` | Store Zustand com persist no localStorage |
| Frontend | `src/routes/_authentication/sign-in/` | Pagina de login |

**Skills relacionadas:** `_backend/019-resources-authentication.md`, `_frontend/020-rotas-autenticacao.md`, `_frontend/011-autenticacao-estado.md`

---

### 3.2 Esconder campos nativos no gerenciar campos

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** Campos nativos removidos da visualizacao. Deve ser possivel visualizar apenas campos configurados pelo gestor da tabela.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/management.tsx:77` | `const nonNativeFields = fields.filter((f) => !f.native)` |
| Frontend | `src/routes/_private/tables/$slug/field/-field-order-form.tsx` | Listagem de campos gerenciaveis |
| Backend | `application/model/field.model.ts` | Flag `native: Boolean` nos campos |

**Skills relacionadas:** `_frontend/027-rotas-tabelas-campos.md`, `_backend/025-resources-table-fields.md`

---

### 3.3 Valor default de tamanho do campo

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** Valor padrao de largura: lista = 10%, formulario = 50%.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/model/field.model.ts` | `widthInList: { type: Number, default: 10 }`, `widthInForm: { type: Number, default: 50 }` |
| Frontend | `src/lib/schemas.ts:299-300` | `widthInForm: z.number().nullable().default(50)`, `widthInList: z.number().nullable().default(10)` |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx:36-37` | Defaults no schema de update `widthInForm: 50`, `widthInList: 10` |

**Skills relacionadas:** `_base/004-skill-schema-api.md`, `_base/024-skill-schema-zod.md`

---

### 3.4 Input numerico para tamanho (substituir dropdown)

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** Retirado dropdown do tamanho, agora aceita numero inteiro de 0 a 100.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/create/-create-form.tsx` | Input de largura no formulario de criacao |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx` | Input de largura no formulario de edicao |

**Skills relacionadas:** `_base/021-skill-form-field.md`, `_frontend/015-formularios.md`

---

### 3.5 Perfil do usuario logado nao aparece na listagem

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | ~Fev 2026 |
| **Report** | - |
| **Status** | Pendente |

**Descricao:** Na listagem de usuarios, o perfil do usuario logado nao aparece. Deve aparecer todos os usuarios.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/users/paginated/` | Use-case de listagem paginada (possivel filtro excluindo user logado) |
| Backend | `application/repositories/user/` | Repository de usuarios (query de listagem) |
| Frontend | `src/routes/_private/users/` | Pagina de listagem de usuarios |
| Frontend | `src/hooks/tanstack-query/` | Hook de query de usuarios paginados |

**Skills relacionadas:** `_backend/020-resources-users.md`, `_frontend/023-rotas-usuarios.md`

---

### 3.6 Botao para Master excluir definitivamente tabelas

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Report** | [12 fev 2026] + [13 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** Adicionados botoes de "enviar para lixeira", "restaurar da lixeira" e "excluir permanentemente". Botoes de acoes movidos para grupo de menu na propria listagem.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/table-base/delete/` | Exclusao permanente de tabela |
| Backend | `application/resources/table-base/send-to-trash/` | Enviar tabela para lixeira |
| Backend | `application/resources/table-base/remove-from-trash/` | Restaurar tabela da lixeira |
| Frontend | `src/routes/_private/tables/` | Listagem com botoes de acao (menu dropdown) |
| Frontend | `src/hooks/tanstack-query/` | Hooks de mutation para trash/restore/delete |

**Skills relacionadas:** `_backend/024-resources-table-base.md`, `_frontend/026-rotas-tabelas-base.md`

---

### 3.7 Layout galeria com imagem acima e 2 colunas

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Fev 2026 |
| **Report** | [13 fev 2026] Jhollyfer |
| **Status** | Corrigido, em reteste |

**Descricao:** No layout galeria, imagem aparece acima dos campos com 2 campos por linha abaixo da imagem.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/` | Componente de visualizacao GALLERY |
| Frontend | `src/components/common/` | Cards de galeria com layout de imagem + campos |
| Backend | `application/model/table.model.ts` | `style: E_TABLE_STYLE.GALLERY` |

**Skills relacionadas:** `_frontend/026-rotas-tabelas-base.md`, `_base/022-skill-componente-ui.md`

---

## 4. PROXIMO (AJUSTES E MELHORIAS)

### 4.1 Paginas restritas consultadas sem autenticacao

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro de seguranca |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Alta |

**Descricao:** Paginas restritas estao sendo consultadas sem autenticacao. Necessario verificar com Francisco.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/pages/show/` | Controller de pagina sem middleware de auth |
| Backend | `application/middlewares/authentication.middleware.ts` | Middleware de autenticacao (optional auth) |
| Backend | `application/middlewares/table-access.middleware.ts` | Controle de acesso por visibilidade |
| Frontend | `src/routes/_private/pages/` | Rotas de paginas |

**Skills relacionadas:** `_backend/028-resources-pages.md`, `_base/007-skill-middleware.md`, `_base/016-skill-rota-publica.md`

---

### 4.2 Configuracao de campos especiais para layouts

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Media |

**Descricao:** Configuracao de campos "especiais" usados nos layouts (Kanban, Galeria, Documento, etc.).

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/model/table.model.ts` | Configuracao de layout por estilo |
| Backend | `application/model/field.model.ts` | Flags de visibilidade por contexto |
| Frontend | `src/routes/_private/tables/$slug/` | Configuracao de layout por tabela |

**Skills relacionadas:** `_backend/024-resources-table-base.md`, `_backend/025-resources-table-fields.md`

---

### 4.3 Importacao/Exportacao de dados via CSV

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Media |

**Descricao:** Exibir funcionalidade de importacao e exportacao de dados via CSV.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `package.json` | Dependencies: `@json2csv/node` v7.0.6, `csv-parser` v3.2.0 (ja instaladas) |
| Backend | `application/resources/table-rows/` | Endpoints de rows (necessario criar endpoint de export/import) |
| Frontend | (novo) | UI de importacao/exportacao a ser criada |

**Skills relacionadas:** `_base/002-skill-controller.md`, `_base/001-skill-use-case.md`

---

### 4.4 Ocultar lixeira em visualizacao publica

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | 28/01/2026 |
| **Prioridade** | Baixa |

**Descricao:** Na visualizacao de uma lista publica, o botao "Ver Lixeira" esta aparecendo e nao deveria.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/` | Componente de listagem com botao de lixeira |
| Frontend | `src/hooks/use-table-permission.ts` | Verificacao de permissao (deve ocultar para visitantes) |

**Skills relacionadas:** `_frontend/026-rotas-tabelas-base.md`, `_base/042-skill-controle-acesso-role.md`

---

### 4.5 Filtros em barra lateral esquerda

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Media |

**Descricao:** Filtros da tabela devem abrir em uma barra na lateral esquerda.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/` | Componente de filtros da tabela |
| Frontend | `src/components/ui/sidebar.tsx` | Componente de sidebar (reutilizavel) |

**Skills relacionadas:** `_base/022-skill-componente-ui.md`, `_frontend/014-componentes-ui.md`

---

### 4.6 Melhorar mensagem de erro para campo duplicado

| Campo | Valor |
|-------|-------|
| **Tipo** | Ajuste |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Baixa |

**Descricao:** Nao permitiu salvar campo com mesmo nome mas nao apresentou mensagem de erro ao usuario.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/resources/table-fields/create/create.use-case.ts` | Validacao de nome duplicado (slug unico) |
| Backend | `application/core/exception.core.ts` | Classes de erro (Conflict 409) |
| Frontend | `src/routes/_private/tables/$slug/field/create/` | Tratamento de erro no formulario |

**Skills relacionadas:** `_base/003-skill-validator.md`, `_base/010-skill-core-either.md`

---

### 4.7 Markdown para texto longo e pagina

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Media |

**Descricao:** Suporte a markdown para campos de texto longo e para paginas.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/entity.core.ts` | `E_FIELD_FORMAT` - adicionar formato MARKDOWN |
| Frontend | `src/components/common/` | Renderizacao de campos texto longo |
| Frontend | `src/routes/_private/pages/` | Renderizacao de paginas |

**Skills relacionadas:** `_base/022-skill-componente-ui.md`, `_frontend/017-editores.md`

---

### 4.8 Acoes em coluna fixa na lateral direita

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | 28/01/2026 |
| **Prioridade** | Media |

**Descricao:** Botao "novo campo" desaparece em tabelas com muitos campos. Sugere-se coluna fixa na lateral direita para acoes. Tambem vale para o botao de adicionar campo.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/` | Layout de tabela com acoes |
| Frontend | `src/routes/_private/tables/$slug/field/management.tsx` | Botao de novo campo |

**Skills relacionadas:** `_base/028-skill-tabela-paginada.md`, `_frontend/026-rotas-tabelas-base.md`

---

### 4.9 Ajustar validacao de campo (botao salvar apos validacao)

| Campo | Valor |
|-------|-------|
| **Tipo** | Erro |
| **Reportado em** | 09/02/2026 |
| **Prioridade** | Alta |

**Descricao:** Quando e realizada a validacao de algum campo obrigatorio, apos preencher os campos, o botao salvar nao e ativado novamente. Necessario reiniciar todo o processo de criacao do campo.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Frontend | `src/routes/_private/tables/$slug/field/create/-create-form.tsx` | Estado do botao de submit |
| Frontend | `src/routes/_private/tables/$slug/field/$fieldId/-update-form.tsx` | Estado do botao de submit |
| Frontend | `src/integrations/tanstack-form/` | `form.canSubmit` / `form.isValid` reatividade |

**Skills relacionadas:** `_base/020-skill-formulario.md`, `_base/003-skill-validator.md`

---

### 4.10 Campo password (formato para texto com bcrypt)

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | 05/02/2026 |
| **Prioridade** | Media |

**Descricao:** Formato password para campo texto: guarda valor encriptado com bcrypt. UI com botao de olho para mostrar/ocultar senha.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/core/entity.core.ts` | `E_FIELD_FORMAT` - adicionar PASSWORD |
| Backend | `application/core/row-payload-validator.core.ts` | Validacao e hash com bcrypt |
| Backend | `package.json` | `bcryptjs` ja instalado |
| Frontend | `src/components/common/` | Novo componente de input password com toggle |
| Frontend | `src/routes/_private/tables/$slug/row/` | Renderizacao do campo password |

**Skills relacionadas:** `_base/021-skill-form-field.md`, `_base/022-skill-componente-ui.md`

---

### 4.11 Criar 2 conexoes de banco

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Baixa |

**Descricao:** 1 conexao para as colecoes nativas da ferramenta e outra conexao para as colecoes de dados criadas pela ferramenta.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `database/` | Configuracao de conexao MongoDB |
| Backend | `config/` | Configuracoes de ambiente |
| Backend | `application/core/util.core.ts` | Criacao de models dinamicos (usar segunda conexao) |

**Skills relacionadas:** `_backend/005-database.md`, `_backend/003-config.md`

---

### 4.12 Implementar Notificacoes e Websocket

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Media |

**Descricao:** Sistema de notificacoes em tempo real via WebSocket.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `start/kernel.ts` | Registrar plugin WebSocket no Fastify |
| Backend | (novo) | Servico de notificacoes |
| Frontend | (novo) | Provider WebSocket e componente de notificacoes |

**Skills relacionadas:** `_base/014-skill-kernel.md`, `_base/012-skill-service.md`

---

### 4.13 Implementar Agendamentos (CRON/Jobs)

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Baixa |

**Descricao:** Sistema de agendamento de tarefas (CRON jobs).

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | (novo) | Servico de agendamento |
| Backend | `start/kernel.ts` | Registrar servico de cron |

**Skills relacionadas:** `_base/014-skill-kernel.md`, `_base/012-skill-service.md`

---

### 4.14 Implementar User Metadata

| Campo | Valor |
|-------|-------|
| **Tipo** | Melhoria |
| **Reportado em** | ~Fev 2026 |
| **Prioridade** | Baixa |

**Descricao:** Forma de uma tabela estender os metadados do usuario. Sugestao: a tabela cria um grupo de campos para os usuarios.

**Locais no codigo:**

| Camada | Arquivo | Detalhe |
|--------|---------|---------|
| Backend | `application/model/user.model.ts` | Schema de usuario (adicionar metadata) |
| Backend | `application/model/table.model.ts` | Linkagem de tabela com metadados de usuario |
| Backend | `application/resources/users/` | Endpoints de usuarios |
| Frontend | `src/routes/_private/users/` | Formularios de usuario |

**Skills relacionadas:** `_backend/020-resources-users.md`, `_base/008-skill-model.md`

---

## 5. TIMELINE DE REPORTS

| Data | Item | Tipo | Acao |
|------|------|------|------|
| 27/01/2026 | Padrao para importar dados | Erro | Reportado |
| 28/01/2026 | Erro de validacao no formulario | Erro | Reportado |
| 28/01/2026 | Relacionamento bidirecional | Melhoria | Reportado |
| 28/01/2026 | Ocultar lixeira (lista publica) | Ajuste | Reportado |
| 28/01/2026 | Acoes em coluna fixa (botao novo campo some) | Melhoria | Reportado |
| 31/01/2026 | Padrao para importar dados | Erro | **Corrigido** (Jhollyfer) |
| 02/02/2026 | Erro ao definir imagem no projeto | Erro | Reportado |
| 02/02/2026 | Associacao cliente-usuario | Duvida | Reportado |
| 04/02/2026 | Erro ao salvar metodo em tabela | Erro | Reportado |
| 05/02/2026 | Campo password | Melhoria | Reportado |
| 09/02/2026 | Validacao de campo (botao nao reativa) | Erro | Reportado |
| 10/02/2026 | Relacionamento bidirecional | Melhoria | **Corrigido** (Jhollyfer) |
| 11/02/2026 | Nao foi possivel alterar o logo | Erro | Reportado + **Corrigido** (Jhollyfer) |
| 12/02/2026 | Arquivo do campo arquivo | Erro | **Corrigido** (Jhollyfer) |
| 12/02/2026 | Erro ao logar pelo Chrome | Erro | **Corrigido** (Jhollyfer) |
| 12/02/2026 | Esconder campos nativos | Ajuste | **Corrigido** (Jhollyfer) |
| 12/02/2026 | Valor default tamanho campo | Ajuste | **Corrigido** (Jhollyfer) |
| 12/02/2026 | Input numerico para tamanho | Ajuste | **Corrigido** (Jhollyfer) |
| 12/02/2026 | Botao excluir definitivamente | Melhoria | **Corrigido** (Jhollyfer) |
| 13/02/2026 | Botoes de acao movidos para menu | Melhoria | **Ajustado** (Jhollyfer) |
| 13/02/2026 | Layout galeria com imagem + 2 colunas | Ajuste | **Corrigido** (Jhollyfer) |

---

## 6. MAPEAMENTO POR AREA DO CODIGO

### Backend

| Area | Diretorio | Itens Relacionados |
|------|-----------|-------------------|
| Autenticacao | `application/resources/authentication/` | 3.1 (Chrome login), 1.1 (espaco email) |
| Middleware Auth | `application/middlewares/authentication.middleware.ts` | 3.1, 4.1 (paginas sem auth) |
| Middleware Access | `application/middlewares/table-access.middleware.ts` | 4.1 (paginas restritas) |
| Storage/Upload | `application/services/storage.service.ts` | 2.1 (arquivo nao salva) |
| Table Base | `application/resources/table-base/` | 3.6 (excluir definitivamente) |
| Table Fields | `application/resources/table-fields/` | 2.2 (dropdown grupo), 3.2, 3.3, 3.4 |
| Table Rows | `application/resources/table-rows/` | 2.3 (tabela inicio), 1.7 (importar) |
| Users | `application/resources/users/` | 3.5 (usuario nao aparece) |
| Settings | `application/resources/setting/` | 1.5 (logo), 1.9 (imagem projeto) |
| Models | `application/model/` | Quase todos os itens |
| Core | `application/core/` | 2.3, 2.4, 1.7, 1.8 |
| Pages | `application/resources/pages/` | 4.1 (paginas sem auth) |

### Frontend

| Area | Diretorio | Itens Relacionados |
|------|-----------|-------------------|
| Login | `src/routes/_authentication/sign-in/` | 1.1, 3.1 |
| Auth Store | `src/stores/authentication.ts` | 3.1 |
| Tables List | `src/routes/_private/tables/` | 3.6, 2.5, 4.4, 4.8 |
| Table Detail | `src/routes/_private/tables/$slug/` | 2.3, 3.7, 4.5 |
| Field Forms | `src/routes/_private/tables/$slug/field/` | 2.2, 2.4, 3.2, 3.3, 3.4, 4.9 |
| Row Forms | `src/routes/_private/tables/$slug/row/` | 2.1, 2.3 |
| Field Mgmt | `src/routes/_private/tables/$slug/field/management.tsx` | 3.2, 4.8 |
| Users | `src/routes/_private/users/` | 3.5 |
| Settings | `src/routes/_private/settings/` | 1.5, 1.9 |
| Kanban | `src/components/kanban/` | 1.4 |
| Common | `src/components/common/` | 1.3, 3.7, 4.10 |
| Schemas | `src/lib/schemas.ts` | 2.4, 3.3, 3.4 |
| Hooks | `src/hooks/tanstack-query/` | 2.1, 3.6 |
| Pages | `src/routes/_private/pages/` | 4.1 |

### Skills Relacionadas

| Skill | Arquivo | Itens |
|-------|---------|-------|
| Validador | `_base/003-skill-validator.md` | 1.1, 1.7, 2.4, 4.6, 4.9 |
| Controller | `_base/002-skill-controller.md` | 4.3, 1.11 |
| Schema API | `_base/004-skill-schema-api.md` | 1.5, 3.3 |
| Schema Zod | `_base/024-skill-schema-zod.md` | 1.1, 3.3 |
| Model | `_base/008-skill-model.md` | 1.3, 1.4, 2.3, 4.14 |
| Repository | `_base/009-skill-repository.md` | 1.8 |
| Formulario | `_base/020-skill-formulario.md` | 1.2, 1.9, 2.2, 2.4, 4.9 |
| Form Field | `_base/021-skill-form-field.md` | 3.4, 4.10 |
| Componente UI | `_base/022-skill-componente-ui.md` | 3.7, 4.5, 4.7, 4.10 |
| Tabela Paginada | `_base/028-skill-tabela-paginada.md` | 2.5, 4.8 |
| File Upload | `_base/033-skill-file-upload.md` | 2.1 |
| Middleware | `_base/007-skill-middleware.md` | 4.1 |
| Rota Publica | `_base/016-skill-rota-publica.md` | 4.1 |
| Kernel | `_base/014-skill-kernel.md` | 4.12, 4.13 |
| Controle Acesso | `_base/042-skill-controle-acesso-role.md` | 4.4 |
| Hook Query | `_base/017-skill-hook-query.md` | 3.5 |
| Hook Mutation | `_base/018-skill-hook-mutation.md` | 2.1 |
| Auth Backend | `_backend/019-resources-authentication.md` | 1.1, 3.1 |
| Table Base Backend | `_backend/024-resources-table-base.md` | 3.6, 4.2 |
| Table Fields Backend | `_backend/025-resources-table-fields.md` | 2.2, 3.2 |
| Table Rows Backend | `_backend/026-resources-table-rows.md` | 1.7, 1.8, 2.3 |
| Users Backend | `_backend/020-resources-users.md` | 3.5, 4.14 |
| Storage Backend | `_backend/029-resources-storage.md` | 2.1 |
| Setting Backend | `_backend/031-resources-setting.md` | 1.5, 1.9 |
| Pages Backend | `_backend/028-resources-pages.md` | 4.1 |
| Auth Frontend | `_frontend/020-rotas-autenticacao.md` | 1.1, 3.1 |
| Tables Frontend | `_frontend/026-rotas-tabelas-base.md` | 3.6, 3.7, 4.4, 4.8 |
| Fields Frontend | `_frontend/027-rotas-tabelas-campos.md` | 3.2 |
| Users Frontend | `_frontend/023-rotas-usuarios.md` | 3.5 |
| Kanban Frontend | `_frontend/018-componentes-kanban.md` | 1.4 |
| Formularios Frontend | `_frontend/015-formularios.md` | 1.2, 3.4 |
| Auth Estado Frontend | `_frontend/011-autenticacao-estado.md` | 3.1 |
