# Fixes e Correções - LowCodeJS

> Documento de rastreamento de bugs, correções, melhorias e features pendentes da plataforma LowCodeJS.
>
> **Última atualização:** 12/02/2026

---

## Legenda de Tipos

| Ícone | Tipo | Descrição |
|:---:|---|---|
| ✅ | Passou no teste | Item validado e funcionando |
| ❌ | Erro | Requisito não funciona e/ou dá tela de erro |
| 🔧 | Ajuste | Pequena alteração em funcionalidade existente, sem percepção de erro para o usuário |
| 🔄 | Correção e retestar | Fix aplicado, aguardando reteste |
| 🆕 | Melhoria | Nova funcionalidade |
| 🚫 | Descartado | Não considerado como erro |

---

## Resumo Geral por Tipo

| Tipo | Quantidade |
|---|:---:|
| ❌ Erro | 9 |
| 🔧 Ajuste | 4 |
| 🔄 Correção e retestar | 5 |
| 🆕 Melhoria | 11 |
| ✅ Passou no teste | 12 |
| 🚫 Descartado | 0 |
| **Total** | **41** |

---

## Configurações (Settings/Logo)

| # | Item | Tipo |
|---|---|---|
| 1 | Não foi possível alterar o logo | ✅ Passou no teste |

### 1. Não foi possível alterar o logo

- **Data:** 11/02/2026
- **Descrição:** Ao tentar alterar o logo nas configurações do sistema, a operação falha. A definição de templates possuir `_id` (constante) não válido no Mongoose acarretou na invalidação dos dados enviados para a rota da API.
- **Resolução aplicada:** Ignorar os `_id`s dos TEMPLATES e enviar apenas IDs de modelos persistidos na base de dados.
- **Link:** https://net.labic.3ck.org/settings
- **Reporter:** Jhollyfer (11/02/2026)
- **Arquivos relacionados:**
  - `backend/application/resources/setting/update/update.use-case.ts`
  - `backend/application/resources/setting/update/update.validator.ts`
  - `backend/application/resources/tools/clone-table/templates/`
  - `frontend/src/routes/_private/settings/index.tsx`

---

## Campos & Validação

| # | Item | Tipo |
|---|---|---|
| 2 | Campos nativos aparecendo e com controle de visibilidade/ordenação | ✅ Passou no teste |
| 3 | Erro no modelo de documento (campos nativos) | ✅ Passou no teste |
| 4 | Erro no modelo kanban (campos nativos) | ✅ Passou no teste |
| 5 | Botão salvar não reativa após validação de campo obrigatório | ❌ Erro |
| 6 | Erro ao criar novo campo (com sub-itens de 11/02) | ❌ Erro |
| 7 | Erro de validação no formulário (campos e settings) | ✅ Passou no teste |
| 8 | Configuração de campos especiais usados nos layouts | 🆕 Melhoria |
| 9 | Formato Password para campo texto | 🆕 Melhoria |
| 10 | Suporte a Markdown | 🆕 Melhoria |
| 11 | Campos nativos para documentos embutidos | ✅ Passou no teste |
| 35 | Dropdown no grupo de campos com erro | 🔄 Correção e retestar |
| 36 | Erro na tabela Início com todos os campos criados | 🔄 Correção e retestar |
| 37 | Melhorar mensagem ao salvar campo com mesmo nome | 🔧 Ajuste |
| 38 | Não está salvando o arquivo do campo arquivo | 🔄 Correção e retestar |
| 39 | Esconder campos nativos no gerenciar campos | 🔄 Correção e retestar |

### 2. Campos nativos aparecendo e com controle de visibilidade/ordenação

- **Data:** 11/02/2026
- **Descrição:** Campos nativos (como `_id`, `createdAt`, `trashed`, etc.) estão aparecendo indevidamente nas views e podem ter controle de visibilidade/ordenação incorreto. Afeta tanto o modelo de documento quanto o modelo kanban.
- **Arquivos relacionados:**
  - `backend/application/core/entity.core.ts` (`FIELD_NATIVE_LIST`)
  - `backend/application/resources/tools/clone-table/templates/document-template.ts`
  - `backend/application/resources/tools/clone-table/templates/kanban-template.ts`
  - `frontend/src/routes/_private/tables/$slug/-table-document-view.tsx`
  - `frontend/src/routes/_private/tables/$slug/-table-kanban-view.tsx`

### 3. Erro no modelo de documento (campos nativos)

- **Data:** 11/02/2026
- **Descrição:** Sub-problema do item 2. Campos nativos aparecendo no modelo de documento.
- **Arquivos relacionados:**
  - `backend/application/resources/tools/clone-table/templates/document-template.ts`
  - `frontend/src/routes/_private/tables/$slug/-table-document-view.tsx`

### 4. Erro no modelo kanban (campos nativos)

- **Data:** 11/02/2026
- **Descrição:** Sub-problema do item 2. Campos nativos aparecendo no modelo kanban.
- **Arquivos relacionados:**
  - `backend/application/resources/tools/clone-table/templates/kanban-template.ts`
  - `frontend/src/routes/_private/tables/$slug/-table-kanban-view.tsx`

### 5. Botão salvar não reativa após validação de campo obrigatório

- **Data:** 09/02/2026
- **Descrição:** Quando é realizada a validação de algum campo obrigatório, após preencher os campos, o botão salvar não é ativado novamente para continuar. É necessário reiniciar todo o processo de criação do campo.
- **Arquivos relacionados:**
  - `frontend/src/lib/table.ts` (`buildFieldValidator`)
  - `frontend/src/integrations/tanstack-form/form-hook.ts`

### 6. Erro ao criar novo campo (com sub-itens de 11/02)

- **Data:** 11/02/2026
- **Descrição:** Falha ao tentar criar um novo campo em uma tabela.
- **Link:** https://net.labic.3ck.org/tables/listas/field/create
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/field/management.tsx`

**Sub-itens [11/02/2026]:**
- Não permitiu salvar campo com mesmo nome (sem mensagem de erro)
- Dropdown não disponível em grupo de campos (botão criar não habilita)
- Bug ao mudar de dropdown para outro formato
- Erro após registro criado
- Sugestão: voltar a salvar com espaço, não só com +

### 7. Erro de validação no formulário (campos e settings)

- **Data:** 28/01/2026 – 02/02/2026
- **Descrição:** Na opção de manutenção dos campos de uma tabela, se o usuário tentar alterar ou inserir um campo e esquecer de colocar algum valor obrigatório, o formulário é validado e a mensagem é informada. Porém, após informar o valor, o botão "Criar" continua desabilitado e não permite seguir na operação desejada. Também ocorre nas configurações: ao definir uma nova imagem no projeto e salvar, o sistema informa que deve ser informada uma tabela modelo. Após selecionar a tabela modelo, o botão salvar continua desabilitado.
- **Link:** https://admin-saneago.3ck.org/tables/bairros/field/create
- **Arquivos relacionados:**
  - `frontend/src/lib/table.ts` (`buildFieldValidator`)
  - `frontend/src/integrations/tanstack-form/form-hook.ts`
  - `frontend/src/routes/_private/settings/index.tsx`
  - `backend/application/resources/setting/update/update.validator.ts`

### 8. Configuração de campos especiais usados nos layouts

- **Data:** Reportado
- **Descrição:** Permitir configuração de campos especiais que são utilizados nos diferentes layouts (Kanban, Document, Gallery, etc.), como título, descrição, membros, data de vencimento, entre outros.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/-table-kanban-view.tsx` (mapeamento hardcoded de campos)
  - `frontend/src/routes/_private/tables/$slug/-table-document-view.tsx`

### 9. Formato Password para campo texto

- **Data:** 05/02/2026
- **Descrição:** Implementar formatação para campo texto do tipo password: um campo texto que guarda o conteúdo encriptado usando bcrypt. Necessário efeito de visualizar ou não o dado do campo clicando no ícone de olho. Atualmente a senha fica visível.
- **Arquivos relacionados:**
  - `frontend/src/components/common/tanstack-form/field-password.tsx` (já existe para login)
  - `frontend/src/lib/constant.ts` (adicionar formato PASSWORD ao `E_FIELD_TYPE` ou formatos de `TEXT_SHORT`)
  - `backend/application/core/entity.core.ts`

### 10. Suporte a Markdown

- **Data:** Reportado
- **Descrição:** Implementar suporte completo a Markdown para campos de texto longo e para páginas do sistema. Atualmente o editor rich text existe mas sem suporte pleno a sintaxe Markdown.
- **Sub-itens:**
  - Markdown para texto longo
  - Markdown para página
- **Arquivos relacionados:**
  - `frontend/src/components/common/editor/`
  - `frontend/src/components/common/tanstack-form/table-row-rich-text-field.tsx`

### 11. Campos nativos para documentos embutidos

- **Data:** Reportado
- **Descrição:** Adicionar campos nativos (ID, Created-by, Created-date) para os documentos embutidos dos grupos de campos (field groups).
- **Status:** Realizado.
- **Arquivos relacionados:**
  - `backend/application/core/entity.core.ts` (`FIELD_NATIVE_LIST`)

### 35. Dropdown no grupo de campos com erro

- **Data:** 12/02/2026
- **Descrição:** Desmembrado do item #6. O dropdown não fica disponível dentro de um grupo de campos, fazendo com que o botão de criar não habilite.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/field/management.tsx`

### 36. Erro na tabela Início com todos os campos criados

- **Data:** 12/02/2026
- **Descrição:** Desmembrado do item #6. Erro ocorre na tabela Início quando todos os campos estão criados.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/field/management.tsx`

### 37. Melhorar mensagem ao salvar campo com mesmo nome

- **Data:** 12/02/2026
- **Descrição:** Desmembrado do item #6. Ao tentar salvar um campo com o mesmo nome de um já existente, o sistema não exibe mensagem de erro clara. Deveria informar ao usuário que o nome já está em uso.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/field/management.tsx`

### 38. Não está salvando o arquivo do campo arquivo

- **Data:** 12/02/2026
- **Descrição:** O campo do tipo arquivo não salva o upload no primeiro envio. Somente após salvar o registro e em seguida editar novamente, enviando o arquivo, ele salva corretamente.

### 39. Esconder campos nativos no gerenciar campos

- **Data:** 12/02/2026
- **Descrição:** Campos nativos (`_id`, `createdAt`, `trashed`, etc.) estão aparecendo no dropdown "Gerenciar campos" da configuração da tabela. Apenas campos configurados pelo gestor da tabela devem ser exibidos.
- **Report:** [report][12 fev 2026] Jhollyfer: Campos nativos removidos da visualização, deve ser possível visualizar apenas campos que foram configurados pelo gestor da tabela.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/-table-configuration.tsx`

---

## Autenticação & Login

| # | Item | Tipo |
|---|---|---|
| 12 | Erro ao logar com espaço extra no email | ✅ Passou no teste |
| 13 | Erro ao logar pelo Chrome | 🔄 Correção e retestar |

### 12. Erro ao logar com espaço extra no email

- **Data:** 11/02/2026
- **Descrição:** Se o usuário digitar um espaço a mais no campo de email, o sistema não avisa que o erro é esse e simplesmente não permite o login. Deveria trimmar o input ou exibir mensagem clara.
- **Link:** https://net.labic.3ck.org/
- **Arquivos relacionados:**
  - `frontend/src/routes/_authentication/_sign-in/index.tsx`
  - `backend/application/resources/authentication/sign-in/sign-in.use-case.ts`
  - `backend/application/resources/authentication/sign-in/sign-in.validator.ts`

### 13. Erro ao logar pelo Chrome

- **Data:** Reportado
- **Descrição:** Erro específico ao tentar realizar login utilizando o navegador Google Chrome. O sistema utiliza cookies com `withCredentials: true` via Axios, o que pode causar problemas com políticas de CORS/SameSite em diferentes navegadores.
- **Report:** [report][12 fev 2026] Jhollyfer: Cache utilizava cookies anteriores e não permitia a autenticação correta do usuário, foi criada uma camada de verificação extra no backend para lidar com o cache de cookies.
- **Arquivos relacionados:**
  - `frontend/src/lib/api.ts` (Axios instance com `withCredentials`)
  - `frontend/src/routes/_authentication/_sign-in/index.tsx`
  - `backend/application/resources/authentication/sign-in/sign-in.use-case.ts`

---

## Tabelas & Registros

| # | Item | Tipo |
|---|---|---|
| 14 | Erro ao criar registro novo - tela em branco | ❌ Erro |
| 15 | Edição do registro em branco | ❌ Erro |
| 16 | Erro ao deletar registro | ❌ Erro |
| 17 | Ajustar modelo de cards para campos essenciais | 🔧 Ajuste |
| 18 | Botão para Master excluir definitivamente tabelas | 🆕 Melhoria |
| 19 | Restrição na criação de tabela Kanban | 🔧 Ajuste |
| 20 | Relacionamento bidirecional | ✅ Passou no teste |
| 21 | Erro ao salvar método dentro de tabela | ✅ Passou no teste |
| 22 | Padrão para importar dados | ✅ Passou no teste |

### 14. Erro ao criar registro novo - tela em branco

- **Data:** 11/02/2026
- **Descrição:** Ao tentar criar um registro novo dentro de uma lista criada pelo usuário, a tela fica em branco. O botão "novo registro" deveria ser exibido apenas se houver campos definidos pelo usuário.
- **Resolução em andamento:** O botão "novo registro" só irá ser exibido se houver campos definidos pelo usuário, logo não haverá mais possibilidade do usuário adicionar registros sem ter campos configurados.
- **Link:** https://net.labic.3ck.org/tables/listas/row/create
- **Reporter:** Jhollyfer (11/02/2026)
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/row/create/-create-form.tsx`
  - `backend/application/core/row-payload-validator.core.ts`

### 15. Edição do registro em branco

- **Data:** 11/02/2026
- **Descrição:** Após o erro de não permitir um registro dentro da lista, ao clicar em criar, a mensagem de "registro criado com sucesso" é apresentada. Na tela da lista aparece um registro em branco e mesmo assim é possível editar, mas a tela segue em branco.
- **Links:**
  - https://net.labic.3ck.org/tables/listas/row/create
  - https://net.labic.3ck.org/tables/listas/row/6987b2c2e64ce3b5e5ca7213
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/row/$rowId/-update-row-form.tsx`

### 16. Erro ao deletar registro

- **Data:** 11/02/2026
- **Descrição:** Falha ao tentar deletar um registro existente.
- **Link:** https://net.labic.3ck.org/tables/listas/row/698b279b3ac094999e0ee4aa
- **Arquivos relacionados:**
  - `frontend/src/components/common/trash-button.tsx`

### 17. Ajustar modelo de cards para campos essenciais

- **Data:** 12/02/2026
- **Descrição:** Ajustar o modelo de cards para exibir apenas os campos essenciais, melhorando a visualização e usabilidade.

### 18. Botão para Master excluir definitivamente tabelas

- **Data:** 12/02/2026
- **Descrição:** Implementar botão exclusivo para usuário Master que permita excluir definitivamente tabelas do sistema.

### 19. Restrição na criação de tabela Kanban

- **Data:** 03/02/2026
- **Descrição:** Ao criar uma nova tabela, a opção Kanban está disponível, mas como para criar o Kanban foi definido utilizar um modelo já pré-definido, esta opção não pode estar disponível na criação direta. Todo kanban deve ser criado por meio de um modelo (template) já existente.
- **Arquivos relacionados:**
  - `backend/application/resources/tools/clone-table/templates/kanban-template.ts`
  - `frontend/src/routes/_private/tables/$slug/-table-kanban-view.tsx`

### 20. Relacionamento bidirecional

- **Data:** 28/01/2026
- **Descrição:** Necessidade de acessar dados por meio da API de forma mais dinâmica via relacionamentos bidirecionais. Exemplo: na coleção de bairros com município relacionado, é necessário passar pelo município e obter somente bairros de um município específico. O endpoint de bairros consegue trazer dados do município relacionado, mas a tabela de municípios não traz dados de bairros.
- **Resolução:** Adicionada lógica de virtual reverse populate para trazer dados bidirecional de um relacionamento.
- **Reporter:** Jhollyfer (10/02/2026)
- **Links:**
  - `https://api.admin-saneago.3ck.org/tables/bairros/rows/paginated?search=Garavelo`
  - Exemplo necessário: `https://api.admin-saneago.3ck.org/tables/bairros/rows/paginated?municipios.nome=Goianira`
- **Arquivos relacionados:**
  - `backend/application/core/util.core.ts` (`findReverseRelationships`, `buildTable`)
  - `docs/lowcodejs/virtual-relationships.md`

### 21. Erro ao salvar método dentro de tabela

- **Data:** 04/02/2026
- **Descrição:** Erro ao salvar um método dentro de uma determinada tabela. Teste em develop e no ambiente da POC da Saneago. Também havia necessidade de criptografar senha (CryptoJS).
- **Status:** Corrigido.

### 22. Padrão para importar dados

- **Data:** 27/01/2026
- **Descrição:** Criar uma forma de importar dados na tabela seguindo um padrão válido. Dados importados diretamente no banco de dados seguindo uma estrutura JSON de um arquivo salvo pelo próprio sistema apresentavam erro ao tentar realizar alterações.
- **Link:** https://admin-saneago.3ck.org/tables/clientes/row/6978dc068036775d45e7919c
- **Resolução:**
  - [31/01/2026] Jhollyfer: Correção submetida - ajuste no mapeamento de payload request e response da API.
  - [31/01/2026] Jhollyfer: Mapeando erros de payload inválido.
  - Documentação gerada: `docs/core/build-row-payload.md`
- **Arquivos relacionados:**
  - `backend/application/core/row-payload-validator.core.ts`
  - `docs/core/build-row-payload.md`

---

## Segurança & Permissões

| # | Item | Tipo |
|---|---|---|
| 23 | Páginas restritas consultadas sem autenticação | ❌ Erro |

### 23. Páginas restritas consultadas sem autenticação

- **Data:** Reportado
- **Descrição:** Páginas que deveriam ser restritas estão acessíveis sem autenticação. O middleware de acesso à tabela (`table-access.middleware.ts`) pode não estar cobrindo todos os cenários de visibilidade (PRIVATE, RESTRICTED, OPEN, PUBLIC, FORM).
- **Arquivos relacionados:**
  - `backend/application/middlewares/table-access.middleware.ts`
  - `frontend/src/hooks/use-table-permission.ts`
  - `frontend/src/lib/menu/menu-access-permissions.ts`

---

## Importação/Exportação

| # | Item | Tipo |
|---|---|---|
| 24 | Importação/Exportação de dados via CSV | 🆕 Melhoria |

### 24. Importação/Exportação de dados via CSV

- **Data:** Reportado
- **Descrição:** Implementar funcionalidade de importação e exportação de dados via CSV. A dependência `@json2csv/node` já existe no `package.json` do backend, mas sem implementação funcional no sistema.
- **Arquivos relacionados:**
  - `backend/package.json` (dependência `@json2csv/node`)
  - Necessário: criar controllers/use-cases para import/export CSV

---

## UI/UX

| # | Item | Tipo |
|---|---|---|
| 25 | Ocultar lixeira em listas públicas | 🔧 Ajuste |
| 26 | Ações em coluna fixa na lateral direita | 🆕 Melhoria |
| 27 | Colocar filtros abrindo em barra na esquerda | 🆕 Melhoria |
| 28 | Perfil do usuario logado não aparece na listagem | ❌ Erro |
| 29 | Ajustes no design conforme especificação | ✅ Passou no teste |
| 40 | O valor default para tamanho do campo na lista deve ser 10% | ❌ Erro |
| 41 | Retirar dropdown do tamanho e permitir digitar número inteiro | ❌ Erro |

### 25. Ocultar lixeira em listas públicas

- **Data:** 28/01/2026
- **Descrição:** Na visualização de uma lista pública, o botão "Ver Lixeira" está sendo exibido indevidamente. Usuários sem permissão de exclusão não deveriam ver esse botão.
- **Link:** https://admin-saneago.3ck.org/tables/cdn?page=1&perPage=50
- **Arquivos relacionados:**
  - `frontend/src/components/common/trash-button.tsx`
  - `frontend/src/hooks/use-table-permission.ts`

### 26. Ações em coluna fixa na lateral direita

- **Data:** 28/01/2026
- **Descrição:** O botão "novo campo" desaparece da tela em tabelas com mais de 10 campos. Sugestão de fixar uma coluna de ações na lateral direita para facilitar a inserção e gestão de campos.
- **Link:** https://admin-saneago.3ck.org/tables/clientes?page=1&perPage=50
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/-table-list-view.tsx`

### 27. Colocar filtros abrindo em barra na esquerda

- **Data:** 12/02/2026
- **Descrição:** Implementar abertura dos filtros em uma barra lateral na esquerda para melhor usabilidade e organização visual.

### 28. Perfil do usuario logado não aparece na listagem

- **Data:** 12/02/2026
- **Descrição:** O perfil do usuário logado não aparece na listagem de usuários.
- **Arquivos relacionados:**
  - `backend/application/resources/profile/`
  - `frontend/src/routes/_private/profile/index.tsx`

### 29. Ajustes no design conforme especificação

- **Data:** Reportado
- **Descrição:** Conjunto de ajustes de design conforme especificação:
  - Tabelas em sistema
  - Editar em cima em detalhes
  - Largura e visibilidade do campo para lista, form e detalhes
  - Checkbox para excluir múltiplas linhas com seleção múltipla via Shift / restaurar múltiplos
- **Status:** Realizado.
- **Arquivos relacionados:**
  - `frontend/src/routes/_private/tables/$slug/-table-list-view.tsx`
  - `frontend/src/routes/_private/tables/$slug/field/management.tsx`

### 40. O valor default para tamanho do campo na lista deve ser 10%

- **Data:** 12/02/2026
- **Descrição:** O valor default para o tamanho do campo na visualização de lista deve ser 10% (no formulário é 50%).

### 41. Retirar dropdown do tamanho e permitir digitar número inteiro

- **Data:** 12/02/2026
- **Descrição:** Retirar o dropdown de seleção de tamanho do campo e permitir que o usuário digite um número inteiro de 0 a 100.

---

## Infraestrutura & Arquitetura

| # | Item | Tipo |
|---|---|---|
| 30 | Criar 2 conexões de banco de dados | 🆕 Melhoria |
| 31 | Implementar Notificações e WebSocket | 🆕 Melhoria |
| 32 | Implementar Agendamentos (CRON Jobs) | 🆕 Melhoria |
| 33 | Implementar User Metadata | 🆕 Melhoria |
| 34 | Integração cliente-usuário e área restrita | ✅ Passou no teste |

### 30. Criar 2 conexões de banco de dados

- **Data:** Reportado
- **Descrição:** Melhoria para criar 2 conexões MongoDB separadas: 1 conexão para as coleções nativas da ferramenta e outra conexão para as coleções de dados criadas pela ferramenta. Isso melhora isolamento e performance.
- **Arquivos relacionados:**
  - `backend/application/core/` (configuração de conexões)

### 31. Implementar Notificações e WebSocket

- **Data:** Reportado
- **Descrição:** Implementar sistema de notificações em tempo real utilizando WebSocket para comunicação bidirecional entre servidor e cliente.

### 32. Implementar Agendamentos (CRON Jobs)

- **Data:** Reportado
- **Descrição:** Implementar sistema de agendamentos usando CRON jobs para execução de tarefas programadas no backend.

### 33. Implementar User Metadata

- **Data:** Reportado
- **Descrição:** Criar uma forma de uma tabela estender os metadados do usuário. Sugestão: a tabela cria um grupo de campos para os usuários, permitindo associar dados customizados a cada usuário do sistema.
- **Arquivos relacionados:**
  - `backend/application/resources/profile/`

### 34. Integração cliente-usuário e área restrita

- **Data:** 02/02/2026
- **Descrição:** Definição de como integrar a tabela de Clientes com a tabela de Usuários para permitir login na área restrita e acesso aos dados do cliente. Sugestão adotada: utilizar ações da tabela - ao persistir, rodar código que cria o usuário na tabela de usuários com perfil de cliente. Associação feita via campo de usuário vinculado ao cliente.
- **Status:** Realizado (definição de abordagem).
- **Arquivos relacionados:**
  - `backend/application/resources/profile/`
  - `frontend/src/routes/_private/profile/index.tsx`

---

## Referência de Arquivos do Codebase

| Área | Arquivos Principais |
|---|---|
| Login/Auth | `frontend/src/routes/_authentication/_sign-in/index.tsx`, `backend/application/resources/authentication/sign-in/` |
| Settings/Logo | `backend/application/resources/setting/update/`, `frontend/src/routes/_private/settings/index.tsx` |
| Templates | `backend/application/resources/tools/clone-table/templates/` |
| Validação | `backend/application/core/row-payload-validator.core.ts`, `frontend/src/lib/table.ts` |
| Kanban | `frontend/src/routes/_private/tables/$slug/-table-kanban-view.tsx`, `backend/application/resources/tools/clone-table/templates/kanban-template.ts` |
| Campos nativos | `backend/application/core/entity.core.ts` (`FIELD_NATIVE_LIST`) |
| Lixeira | `frontend/src/components/common/trash-button.tsx` |
| Permissões | `backend/application/middlewares/table-access.middleware.ts` |
| CSV | `backend/package.json` (dependência `@json2csv/node` - sem implementação) |
| Relacionamentos | `backend/application/core/util.core.ts` (`findReverseRelationships`, `buildTable`) |
| Perfil | `backend/application/resources/profile/`, `frontend/src/routes/_private/profile/index.tsx` |
