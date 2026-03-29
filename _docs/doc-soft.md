# Documentacao de Software – LowcodeJS

**Projeto:** LowcodeJS
**Ambiente de Referencia:** develop
**Versao do documento:** 2.0
**Data:** 28/03/2026
**Baseado em:** Codebase atual (backend + frontend)

---

## Sumario

1. [Visao Geral do Sistema](#1-visão-geral-do-sistema)
2. [Modulos do Sistema](#2-módulos-do-sistema)
3. [Requisitos Funcionais](#3-requisitos-funcionais)
4. [Requisitos Nao Funcionais](#4-requisitos-não-funcionais)
5. [Regras de Negocio](#5-regras-de-negócio)
6. [Casos de Uso](#6-casos-de-uso)
7. [Servicos e APIs](#7-serviços-e-apis)
8. [Modelo de Dominio (Entidades)](#8-modelo-de-domínio-entidades)
9. [Pendencias e Melhorias Identificadas](#9-pendências-e-melhorias-identificadas)

---

## 1. Visao Geral do Sistema

O **LowcodeJS** e uma plataforma low-code que permite criar, gerenciar e visualizar tabelas de dados (listas) com campos personalizaveis, modelos de visualizacao variados, controle de acesso por perfis, e gestao de menus de navegacao. A plataforma e voltada para usuarios nao tecnicos que precisam estruturar e operar dados sem escrever codigo.

### Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Fastify 5 + TypeScript + MongoDB (Mongoose) + Redis + Socket.IO |
| Frontend | React 19 + TanStack Start (SSR/Nitro) + TanStack Router/Query/Form/Table + Tailwind CSS 4 |
| Autenticacao | JWT RS256 (access 24h + refresh 7d) via cookies httpOnly |
| Validacao | Zod (backend + frontend) + AJV (Fastify schema) |
| Storage | Flydrive (local ou S3) |
| Email | Nodemailer (SMTP) + templates EJS |
| Chat IA | Socket.IO + OpenAI + MCP (Model Context Protocol) |
| Testes | Vitest (unit + e2e) |

### Principais capacidades

- Criacao e gerenciamento de listas (tabelas) com campos customizados
- 12 tipos de campos (texto, data, arquivo, dropdown, relacionamento, categoria, avaliacao, reacao, usuario, grupo de campos + 5 nativos)
- 9 modelos de visualizacao configuraveis (lista, card, documento, mosaico, galeria, kanban, forum, calendario, gantt)
- Controle de acesso RBAC com 4 roles e 12 permissoes granulares
- 5 niveis de visibilidade de tabela (public, restricted, open, form, private)
- Gestao de menus hierarquicos com 5 tipos de item
- Clonagem, importacao e exportacao de estruturas de tabelas
- Lixeira com restauracao de itens excluidos (soft delete em todas as entidades)
- Grupos de campos para organizacao de formularios
- Scripts de usuario em sandbox isolada (onLoad, beforeSave, afterSave)
- Chat IA integrado com Socket.IO e MCP
- Forum com canais e mensagens em registros
- Dashboard com graficos e atividade recente
- Paginas customizadas (HTML) via menus
- SEO (robots.txt, sitemap.xml, meta tags OG/Twitter, JSON-LD)

---

## 2. Modulos do Sistema

| ID  | Modulo                   | Descricao                                                    |
| --- | ------------------------ | ------------------------------------------------------------ |
| M01 | Listas (Tabelas)         | Criacao e gerenciamento de tabelas de dados                  |
| M02 | Campos                   | Definicao dos tipos de dados de cada tabela (12 tipos + 5 nativos) |
| M03 | Registros (Itens)        | Operacoes CRUD nos dados das tabelas + bulk operations       |
| M04 | Permissoes               | Controle de usuarios e grupos de acesso (RBAC)               |
| M05 | Visibilidade             | Configuracao de acesso: PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE |
| M06 | Grupo de Campos          | Agrupamento de campos em secoes (sub-tabelas)                |
| M07 | Autenticacao             | Login, sign-up, logout, magic link, recuperacao de senha, refresh token |
| M08 | Modelos de Visualizacao  | 9 modos de exibicao dos registros                            |
| M09 | Gestao de Menus          | Menus hierarquicos com 5 tipos (TABLE, PAGE, FORM, EXTERNAL, SEPARATOR) |
| M10 | Clonagem de Tabelas      | Duplicacao de estrutura de tabelas existentes                |
| M11 | Configuracoes            | Personalizacao geral do sistema                              |
| M12 | Performance              | Suporte a grandes volumes de dados e acessos simultaneos     |
| M13 | Seguranca                | Protecao de rotas, validacao de API, CORS, JWT               |
| M14 | Dashboard                | Graficos, estatisticas e atividade recente                   |
| M15 | Chat IA                  | Chat em tempo real com integracao OpenAI e MCP               |
| M16 | Forum                    | Canais de discussao e mensagens em registros                 |
| M17 | Paginas Customizadas     | Paginas HTML via menus do tipo PAGE                          |
| M18 | Import/Export            | Importacao e exportacao de tabelas                           |
| M19 | Perfil                   | Visualizacao e edicao do perfil do usuario logado            |
| M20 | Scripts/Sandbox          | Execucao de scripts de usuario em VM isolada                 |
| M21 | Storage                  | Upload e gerenciamento de arquivos (local/S3)                |

---

## 3. Requisitos Funcionais

### RF-M01 – Listas (Tabelas)

| ID     | Requisito                                                                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-001 | O sistema deve listar todas as tabelas cadastradas em modo lista com paginacao                                                                             |
| RF-002 | O sistema deve exibir por tabela: nome, link, visibilidade, data de criacao e criador                                                                      |
| RF-003 | O sistema deve permitir configurar a quantidade de registros exibidos por pagina                                                                           |
| RF-004 | O sistema deve permitir navegar entre paginas da listagem                                                                                                  |
| RF-005 | O sistema deve permitir copiar o link de uma tabela a partir da listagem                                                                                   |
| RF-006 | O sistema deve oferecer busca global de listas por nome, ignorando acentos, maiusculas/minusculas e suportando busca parcial (LIKE) e caracteres especiais |
| RF-007 | A busca de listas deve funcionar de forma global (sem exigir navegacao pagina a pagina)                                                                    |
| RF-008 | O sistema deve permitir criar uma nova lista informando nome e descricao                                                                                   |
| RF-009 | O sistema deve permitir editar o nome e a descricao de uma lista existente                                                                                 |
| RF-010 | O sistema deve permitir alterar a visibilidade de uma lista (PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE)                                                      |
| RF-011 | O sistema deve permitir enviar uma lista para a lixeira (soft delete)                                                                                      |
| RF-012 | O sistema deve permitir restaurar uma lista da lixeira                                                                                                     |
| RF-013 | O sistema deve permitir excluir permanentemente uma lista da lixeira (hard delete)                                                                         |
| RF-014 | O menu de acoes de uma lista deve conter: compartilhar link, exportar, excluir e visualizar                                                                |
| RF-015 | O sistema deve permitir alterar o modo de colaboracao de uma lista (OPEN, RESTRICTED)                                                                      |
| RF-016 | O sistema deve permitir alterar o estilo de visualizacao de uma lista (LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM, CALENDAR, GANTT)              |

### RF-M02 – Campos

| ID     | Requisito                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-017 | O sistema deve permitir criar campos nos seguintes tipos: TEXT_SHORT, TEXT_LONG, DROPDOWN, DATE, RELATIONSHIP, FILE, FIELD_GROUP, CATEGORY, REACTION, EVALUATION, USER |
| RF-018 | O sistema deve permitir editar qualquer campo existente                                                                                                          |
| RF-019 | O sistema deve permitir excluir campos (soft delete para lixeira)                                                                                                |
| RF-020 | O sistema deve permitir restaurar campos da lixeira                                                                                                              |
| RF-021 | O sistema deve permitir excluir campos permanentemente (hard delete)                                                                                             |
| RF-022 | O sistema deve permitir marcar/desmarcar um campo como obrigatorio                                                                                               |
| RF-023 | O sistema deve permitir reordenar campos via drag-and-drop ou selecao de ordem                                                                                   |
| RF-024 | O sistema deve permitir configurar se um campo aparece no filtro (showInFilter)                                                                                  |
| RF-025 | O sistema deve permitir configurar se um campo e exibido na listagem (showInList)                                                                                |
| RF-026 | O sistema deve permitir configurar se um campo e exibido no formulario (showInForm)                                                                              |
| RF-027 | O sistema deve permitir configurar se um campo e exibido no detalhe (showInDetail)                                                                               |
| RF-028 | O sistema deve permitir configurar a largura de exibicao do campo (widthInForm, widthInList, widthInDetail)                                                      |
| RF-029 | O campo do tipo **TEXT_SHORT** deve suportar os formatos: ALPHA_NUMERIC, INTEGER, DECIMAL, URL, EMAIL, PASSWORD, PHONE, CNPJ, CPF                                |
| RF-030 | O campo **PASSWORD** deve ocultar o valor digitado e oferecer opcao de mostrar/ocultar                                                                           |
| RF-031 | O campo do tipo **TEXT_LONG** deve suportar os formatos: PLAIN_TEXT e RICH_TEXT (editor Tiptap WYSIWYG)                                                           |
| RF-032 | O campo do tipo **DATE** deve validar datas, suportar 12 formatos (com/sem hora, com / e -), permitir ordenacao e filtro por periodo                             |
| RF-033 | O campo do tipo **FILE** deve suportar upload de um ou multiplos arquivos, com validacao de tipo e tamanho                                                        |
| RF-034 | O campo do tipo **DROPDOWN** deve permitir cadastrar opcoes, selecionar uma ou multiplas, ordenar opcoes e usa-lo em filtros                                      |
| RF-035 | O campo do tipo **RELATIONSHIP** deve suportar vinculacao entre tabelas, com adicao e remocao de itens relacionados e consulta por relacionamento                 |
| RF-036 | O campo do tipo **CATEGORY** deve suportar estrutura hierarquica (arvore), selecao de itens, edicao e uso em filtros                                              |
| RF-037 | O campo do tipo **EVALUATION** deve suportar insercao e alteracao de avaliacao numerica, com modo de voto restrito e publico                                      |
| RF-038 | O campo do tipo **REACTION** deve suportar like/unlike em registros com contagem e restricao por autenticacao                                                     |
| RF-039 | O campo do tipo **USER** deve permitir selecionar um usuario existente como valor do campo                                                                        |
| RF-040 | O campo do tipo **FIELD_GROUP** deve permitir criar sub-tabelas com CRUD de linhas dentro do grupo                                                                |
| RF-041 | O sistema deve incluir automaticamente 5 campos nativos em toda tabela: CREATOR, IDENTIFIER, CREATED_AT, TRASHED, TRASHED_AT                                     |
| RF-042 | O sistema deve permitir adicionar opcoes de categoria (add-category) a campos                                                                                     |

### RF-M03 – Registros (Itens)

| ID     | Requisito                                                                                |
| ------ | ---------------------------------------------------------------------------------------- |
| RF-043 | O sistema deve permitir criar registros em uma lista com todos os campos disponiveis     |
| RF-044 | O sistema deve permitir editar registros existentes                                      |
| RF-045 | O sistema deve permitir enviar registros para a lixeira (soft delete)                    |
| RF-046 | O sistema deve permitir restaurar registros da lixeira                                   |
| RF-047 | O sistema deve permitir excluir registros permanentemente (hard delete)                   |
| RF-048 | O sistema deve permitir ordenar registros por campo                                      |
| RF-049 | O sistema deve permitir filtrar registros por campo                                      |
| RF-050 | O sistema deve permitir buscar registros por texto                                       |
| RF-051 | O sistema deve permitir criar registros com campos vazios (respeitando obrigatoriedade)  |
| RF-052 | A listagem deve refletir imediatamente qualquer alteracao realizada em um registro       |
| RF-053 | O sistema deve permitir operacoes em massa: enviar multiplos registros para lixeira (bulk trash) |
| RF-054 | O sistema deve permitir operacoes em massa: restaurar multiplos registros (bulk restore)  |
| RF-055 | O sistema deve permitir adicionar reacoes (like/unlike) a registros                      |
| RF-056 | O sistema deve permitir adicionar avaliacoes numericas a registros                       |
| RF-057 | O sistema deve permitir adicionar mensagens de forum a registros                         |

### RF-M04 – Permissoes

| ID     | Requisito                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| RF-058 | O sistema deve permitir criar usuarios                                           |
| RF-059 | O sistema deve permitir editar dados de um usuario (nome, email, senha)          |
| RF-060 | O sistema deve permitir alterar o status de um usuario (ACTIVE/INACTIVE)         |
| RF-061 | O sistema deve exibir o usuario atualmente logado na interface                   |
| RF-062 | O sistema deve permitir criar grupos de permissao                                |
| RF-063 | O sistema deve permitir editar grupos e suas permissoes (12 permissoes)          |
| RF-064 | O sistema deve suportar 4 roles: MASTER, ADMINISTRATOR, MANAGER, REGISTERED     |
| RF-065 | Alteracao de senha deve forcar novo login ou invalidar a sessao ativa do usuario |
| RF-066 | O sistema deve listar as 12 permissoes disponiveis (CREATE/UPDATE/REMOVE/VIEW para TABLE/FIELD/ROW) |

### RF-M05 – Visibilidade

| ID     | Requisito                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| RF-067 | Listas com visibilidade **PUBLIC** podem ser visualizadas sem login           |
| RF-068 | Listas com visibilidade **FORM** permitem criacao de registros sem login      |
| RF-069 | Listas com visibilidade **OPEN** permitem VIEW + CREATE_ROW sem login         |
| RF-070 | Listas com visibilidade **RESTRICTED** permitem apenas VIEW para nao-owners   |
| RF-071 | Listas com visibilidade **PRIVATE** sao bloqueadas para nao-owners            |
| RF-072 | O sistema deve suportar modo de colaboracao OPEN (qualquer um edita) e RESTRICTED (somente owner/admins) |

### RF-M06 – Grupo de Campos

| ID     | Requisito                                                                        |
| ------ | -------------------------------------------------------------------------------- |
| RF-073 | O sistema deve permitir criar grupos de campos e vincula-los a uma lista         |
| RF-074 | O sistema deve permitir editar o nome e os campos de um grupo                    |
| RF-075 | O sistema deve permitir excluir grupos de campos (enviar para lixeira)           |
| RF-076 | O sistema deve permitir filtrar registros por grupo de campos                    |
| RF-077 | Os grupos de campos devem ser exibidos corretamente na visualizacao de registros |
| RF-078 | Grupos excluidos devem ter um fluxo claro de restauracao via lixeira             |
| RF-079 | O sistema deve permitir CRUD de linhas (rows) dentro de um grupo de campos       |

### RF-M07 – Autenticacao

| ID     | Requisito                                                                  |
| ------ | -------------------------------------------------------------------------- |
| RF-080 | O sistema deve autenticar usuarios via login e senha (sign-in)             |
| RF-081 | O sistema deve permitir cadastro de novos usuarios (sign-up)               |
| RF-082 | O sistema deve rejeitar credenciais invalidas com mensagem de erro clara   |
| RF-083 | O sistema deve tratar espacos extras no campo de login/senha               |
| RF-084 | O sistema deve permitir logout (sign-out)                                  |
| RF-085 | O sistema deve oferecer recuperacao de senha via email (reset-password)    |
| RF-086 | O sistema deve suportar login simultaneo em multiplos dispositivos         |
| RF-087 | Apos login bem-sucedido, o usuario deve ser redirecionado para a rota padrao do seu role |
| RF-088 | O sistema deve suportar autenticacao via magic link                        |
| RF-089 | O sistema deve suportar refresh token para renovacao automatica de sessao  |
| RF-090 | O sistema deve suportar envio e validacao de codigo (request-code, validate-code) |

### RF-M08 – Modelos de Visualizacao

| ID     | Requisito                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| RF-091 | O sistema deve oferecer o modelo **Lista** com exibicao em colunas, movimentacao, redimensionamento e navegacao por teclado |
| RF-092 | O sistema deve oferecer o modelo **Documento** com cards, sidebar hierarquica (TOC), exportacao PDF e impressao |
| RF-093 | O sistema deve oferecer o modelo **Card** com grade de cards configuraveis (titulo, descricao, imagem de capa) |
| RF-094 | O sistema deve oferecer o modelo **Mosaico** com grade de cards com imagem de capa                             |
| RF-095 | O sistema deve oferecer o modelo **Galeria** com foco em imagens organizadas em grade                          |
| RF-096 | O sistema deve oferecer o modelo **Kanban** com colunas por dropdown, drag-drop de cards, adicao e edicao inline |
| RF-097 | O sistema deve oferecer o modelo **Forum** com canais, mensagens, selecao de participantes e visualizacao de documento |
| RF-098 | O sistema deve oferecer o modelo **Calendario** com visualizacao mensal, semanal e agenda, criacao e exclusao de eventos |
| RF-099 | O sistema deve oferecer o modelo **Gantt** com timeline, barras de progresso e painel lateral                  |
| RF-100 | Em todos os modelos visuais, clicar em um item deve abrir o registro completo                                  |

### RF-M09 – Gestao de Menus

| ID     | Requisito                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| RF-101 | O sistema deve listar os menus cadastrados com: nome, slug, tipo, criado por e criado em                    |
| RF-102 | O sistema deve suportar busca de menus por nome e slug, ignorando maiusculas/minusculas e com busca parcial |
| RF-103 | O sistema deve permitir criar um menu informando nome, slug e tipo                                          |
| RF-104 | O sistema deve suportar 5 tipos de menu: TABLE, PAGE, FORM, EXTERNAL, SEPARATOR                            |
| RF-105 | O sistema deve permitir editar nome, slug e tipo de um menu existente                                       |
| RF-106 | O sistema deve permitir enviar menus para a lixeira (soft delete)                                           |
| RF-107 | O sistema deve permitir restaurar menus da lixeira                                                          |
| RF-108 | O sistema deve permitir excluir menus permanentemente (hard delete)                                         |
| RF-109 | O sistema deve permitir reordenar menus via drag-and-drop                                                   |
| RF-110 | O sistema deve suportar menus hierarquicos (pai/filho)                                                      |
| RF-111 | O acesso a um menu deve redirecionar para a tabela vinculada                                                |
| RF-112 | A exibicao de menus deve respeitar as permissoes do usuario logado                                          |
| RF-113 | A interface do modulo de menus deve estar integralmente em portugues                                        |

### RF-M10 – Clonagem de Tabelas

| ID     | Requisito                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------- |
| RF-114 | O sistema deve permitir clonar a estrutura de uma tabela existente a partir de um dropdown de modelos |
| RF-115 | O processo de clonagem deve copiar: campos (com tipos), grupos de campos e relacionamentos            |
| RF-116 | A clonagem **nao** deve copiar os registros da tabela de origem                                       |
| RF-117 | O sistema deve validar campos obrigatorios (nome e modelo base) no formulario de clonagem             |
| RF-118 | A clonagem deve suportar nomes com caracteres especiais e rejeitar nomes duplicados                   |
| RF-119 | A clonagem nao deve incluir campos que estejam na lixeira                                             |
| RF-120 | Os modelos disponiveis para clonagem sao configurados em Settings (MODEL_CLONE_TABLES)                |

### RF-M11 – Configuracoes do Sistema

| ID     | Requisito                                                           |
| ------ | ------------------------------------------------------------------- |
| RF-121 | O sistema deve permitir alterar o nome exibido do sistema (SYSTEM_NAME) |
| RF-122 | O sistema deve permitir alterar os logotipos (pequeno e grande)     |
| RF-123 | O sistema deve permitir alterar o locale (pt-br, en-us)             |
| RF-124 | O sistema deve permitir configurar limites de upload (tamanho, tipos aceitos, max arquivos) |
| RF-125 | O sistema deve permitir configurar a paginacao padrao               |
| RF-126 | O sistema deve permitir configurar o driver de storage (local/S3)   |
| RF-127 | O sistema deve permitir configurar o provedor de email (SMTP)       |
| RF-128 | O sistema deve permitir selecionar tabelas modelo para clonagem     |
| RF-129 | As configuracoes alteradas devem persistir entre sessoes            |

### RF-M14 – Dashboard

| ID     | Requisito                                                               |
| ------ | ----------------------------------------------------------------------- |
| RF-130 | O sistema deve exibir graficos com dados de tabelas                     |
| RF-131 | O sistema deve exibir graficos com dados de usuarios                    |
| RF-132 | O sistema deve exibir atividade recente                                 |
| RF-133 | O sistema deve exibir cards de estatisticas                             |
| RF-134 | O dashboard deve ser acessivel apenas para usuarios com role MASTER     |

### RF-M15 – Chat IA

| ID     | Requisito                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| RF-135 | O sistema deve oferecer painel de chat com IA integrada (OpenAI)              |
| RF-136 | O chat deve funcionar em tempo real via Socket.IO                             |
| RF-137 | O chat deve suportar envio de imagens (convertidas para base64)               |
| RF-138 | O chat deve suportar envio de PDFs (text extraction via pdf-parse)            |
| RF-139 | O chat deve integrar com MCP para descoberta e execucao de tools dinamicamente |
| RF-140 | O chat deve emitir eventos: status, ready, thinking, tool_call, tool_result, tool_error, message, error |
| RF-141 | O chat deve autenticar via cookie JWT (mesmo token do HTTP)                   |

### RF-M16 – Forum

| ID     | Requisito                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| RF-142 | O sistema deve permitir criar canais de forum                                |
| RF-143 | O sistema deve permitir editar e excluir canais                              |
| RF-144 | O sistema deve permitir enviar mensagens em canais                           |
| RF-145 | O sistema deve permitir selecionar usuarios participantes de um canal        |
| RF-146 | O forum deve ser acessivel como modelo de visualizacao (E_TABLE_STYLE.FORUM) |

### RF-M17 – Paginas Customizadas

| ID     | Requisito                                                                   |
| ------ | --------------------------------------------------------------------------- |
| RF-147 | O sistema deve permitir visualizar paginas por slug                         |
| RF-148 | O conteudo da pagina e definido pelo campo HTML do menu do tipo PAGE        |
| RF-149 | O acesso a paginas deve respeitar as permissoes do menu associado           |

### RF-M18 – Import/Export

| ID     | Requisito                                                                   |
| ------ | --------------------------------------------------------------------------- |
| RF-150 | O sistema deve permitir importar tabelas (estrutura e dados)                |
| RF-151 | O sistema deve permitir exportar tabelas (estrutura e dados)                |
| RF-152 | O sistema deve validar o formato na importacao e tratar erros               |

### RF-M19 – Perfil

| ID     | Requisito                                                                   |
| ------ | --------------------------------------------------------------------------- |
| RF-153 | O sistema deve permitir visualizar dados do perfil do usuario logado        |
| RF-154 | O sistema deve permitir editar dados do perfil (nome, email, senha)         |

### RF-M20 – Scripts/Sandbox

| ID     | Requisito                                                                                  |
| ------ | ------------------------------------------------------------------------------------------ |
| RF-155 | O sistema deve permitir configurar scripts por tabela: onLoad, beforeSave, afterSave       |
| RF-156 | Os scripts devem ser editados via editor de codigo (Monaco Editor)                         |
| RF-157 | A execucao deve ocorrer em VM isolada com timeout de 5 segundos                            |
| RF-158 | Os scripts devem ter acesso as APIs: field, context, email, utils, console                 |
| RF-159 | O acesso a globals perigosos (require, fs, network) deve ser bloqueado                     |
| RF-160 | O resultado da execucao deve retornar success, error e logs capturados                     |

### RF-M21 – Storage

| ID     | Requisito                                                                    |
| ------ | ---------------------------------------------------------------------------- |
| RF-161 | O sistema deve permitir upload de arquivos com suporte a multipart           |
| RF-162 | O sistema deve permitir excluir arquivos enviados                            |
| RF-163 | O sistema deve suportar storage local e S3 (configuravel via STORAGE_DRIVER) |
| RF-164 | O sistema deve validar tipo e tamanho do arquivo conforme configuracoes      |
| RF-165 | O sistema deve gerar URLs virtuais para acesso aos arquivos                  |

---

## 4. Requisitos Nao Funcionais

### RNF – Usabilidade

| ID      | Requisito                                                                                |
| ------- | ---------------------------------------------------------------------------------------- |
| RNF-001 | Toda a interface deve estar integralmente em portugues brasileiro                        |
| RNF-002 | Mensagens de erro devem ser claras, objetivas e em portugues                             |
| RNF-003 | A busca de listas deve operar de forma global, sem exigir navegacao por paginas          |
| RNF-004 | URLs longas em campos do tipo URL devem ser truncadas na exibicao (ex.: com reticencias) |
| RNF-005 | O sistema deve fornecer feedback visual imediato apos acoes de criar, editar e excluir   |
| RNF-006 | Componentes pesados (Monaco Editor, Tiptap) devem ser carregados via lazy loading        |

### RNF – Performance

| ID      | Requisito                                                                                  |
| ------- | ------------------------------------------------------------------------------------------ |
| RNF-007 | O sistema deve suportar tabelas com ate **10.000.000 de registros** sem degradacao critica |
| RNF-008 | As operacoes de busca e filtro devem responder em tempo aceitavel mesmo em grandes volumes |
| RNF-009 | O sistema deve suportar pelo menos **1.000 usuarios simultaneos**                          |
| RNF-010 | A insercao de registros deve ser eficiente mesmo sob carga de 1.000 usuarios paralelos     |
| RNF-011 | O frontend deve usar virtualizacao (TanStack Virtual) para listas longas                   |
| RNF-012 | O backend deve utilizar Redis para cache de dados frequentes                                |

### RNF – Seguranca

| ID      | Requisito                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------- |
| RNF-013 | Rotas protegidas nao devem ser acessiveis sem autenticacao valida                                   |
| RNF-014 | A API deve validar tokens JWT RS256 e rejeitar requisicoes nao autorizadas                          |
| RNF-015 | O sistema deve ter controle de CORS configurado corretamente (origens dinamicas + fixas)             |
| RNF-016 | Campos do tipo senha devem ter seus valores mascarados na interface e nunca trafegar em texto plano |
| RNF-017 | Sessoes devem ser invalidadas apos alteracao de senha pelo administrador                            |
| RNF-018 | Cookies devem ser httpOnly, secure (producao), sameSite configurado                                  |
| RNF-019 | Tokens devem separar ACCESS (24h) e REFRESH (7d) com validacao de tipo                              |
| RNF-020 | Scripts de usuario devem executar em sandbox isolada (Node VM) sem acesso a globals                  |

### RNF – Compatibilidade

| ID      | Requisito                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| RNF-021 | A interface deve funcionar corretamente nos principais navegadores modernos (Chrome, Firefox, Edge, Safari) |

### RNF – Manutenibilidade

| ID      | Requisito                                                                                      |
| ------- | ---------------------------------------------------------------------------------------------- |
| RNF-022 | O sistema deve manter consistencia visual e textual em toda a interface                        |
| RNF-023 | Toda terminologia da interface deve seguir convencao unica (ex.: "Acoes" grafado corretamente) |
| RNF-024 | O backend deve seguir arquitetura em camadas: Controller > Use Case > Repository               |
| RNF-025 | O backend deve usar Either pattern (Left = erro, Right = sucesso) nos use cases                |

---

## 5. Regras de Negocio

| ID    | Regra                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| RN-01 | O nome de uma lista e obrigatorio e deve ter no maximo **40 caracteres**                                               |
| RN-02 | Nao e permitido cadastrar duas listas com o mesmo nome                                                                 |
| RN-03 | Campos marcados como obrigatorios devem impedir a criacao de registros sem valor preenchido                            |
| RN-04 | Quando um campo for enviado para a lixeira, ele deve ser automaticamente definido como **nao obrigatorio**             |
| RN-05 | A clonagem de tabela copia apenas a **estrutura** (campos, grupos, relacionamentos); os registros **nao** sao copiados |
| RN-06 | Campos presentes na lixeira **nao** devem ser incluidos na clonagem                                                    |
| RN-07 | A alteracao de senha de um usuario deve **invalidar as sessoes ativas** do mesmo                                       |
| RN-08 | Listas com visibilidade **PUBLIC** podem ser acessadas sem login (somente visualizacao)                                |
| RN-09 | Listas com visibilidade **RESTRICTED** exigem autenticacao e permitem apenas VIEW para nao-owners                      |
| RN-10 | Listas com visibilidade **OPEN** permitem VIEW + CREATE_ROW para visitantes                                            |
| RN-11 | Listas com visibilidade **FORM** permitem apenas criacao de registros sem login                                        |
| RN-12 | Listas com visibilidade **PRIVATE** sao bloqueadas para nao-owners                                                     |
| RN-13 | O slug de um menu deve ser **unico** no sistema                                                                        |
| RN-14 | Nao e permitido cadastrar menus com nome vazio                                                                         |
| RN-15 | A lixeira de campos, grupos, listas e menus deve oferecer fluxo completo: envio, restauracao e exclusao permanente     |
| RN-16 | Campos do tipo relacionamento devem garantir integridade referencial ao excluir itens relacionados                     |
| RN-17 | A busca de listas deve ser **global** (sem paginacao manual) e nao restrita a pagina atual                             |
| RN-18 | O modelo **Avaliacao** pode ser configurado como voto restrito (apenas autenticados) ou voto publico                   |
| RN-19 | A exportacao de uma lista e uma acao disponivel no menu de acoes da listagem                                           |
| RN-20 | Scripts de usuario executam com timeout de **5 segundos** em VM isolada                                                |
| RN-21 | MASTER bypassa todas as verificacoes de permissao                                                                       |
| RN-22 | ADMINISTRATOR tem acesso a todas as tabelas                                                                             |
| RN-23 | MANAGER pode fazer CRUD respeitando ownership da tabela                                                                 |
| RN-24 | REGISTERED pode apenas VIEW + CREATE_ROW                                                                                |
| RN-25 | Os modelos disponiveis para clonagem sao configurados em Settings (MODEL_CLONE_TABLES)                                 |
| RN-26 | Soft delete: todas as entidades usam `trashed` (boolean) + `trashedAt` (Date) — dados nunca sao hard-deleted por padrao |

---

## 6. Casos de Uso

### UC-01 – Gerenciar Lista

**Ator:** Usuario autenticado
**Pre-condicao:** Usuario logado no sistema
**Fluxo principal:**

1. Usuario acessa o modulo de Listas
2. Sistema exibe as listas em modo paginado
3. Usuario pode criar, editar, alterar visibilidade/colaboracao/estilo, enviar para lixeira ou exportar uma lista

**Fluxos alternativos:**

- _Nome vazio:_ Sistema exibe erro de validacao
- _Nome duplicado:_ Sistema rejeita com mensagem especifica
- _Lixeira:_ Usuario pode restaurar ou excluir permanentemente

---

### UC-02 – Gerenciar Campos de uma Lista

**Ator:** Usuario autenticado
**Pre-condicao:** Lista existente
**Fluxo principal:**

1. Usuario acessa a configuracao de uma lista
2. Adiciona campos escolhendo tipo (11 tipos) e configuracoes (obrigatorio, visivel, filtro, formato)
3. Salva o campo; sistema o exibe na estrutura da lista

**Fluxos alternativos:**

- _Campo enviado para lixeira:_ Campo torna-se nao obrigatorio automaticamente
- _Edicao de campo:_ Usuario altera propriedades sem recriar o campo
- _Restauracao:_ Campo pode ser restaurado da lixeira

---

### UC-03 – Criar e Editar Registro

**Ator:** Usuario autenticado
**Pre-condicao:** Lista com campos configurados
**Fluxo principal:**

1. Usuario acessa a lista e clica em "Novo Registro"
2. Preenche os campos disponiveis
3. Sistema valida campos obrigatorios
4. Scripts beforeSave sao executados (se configurados)
5. Registro e salvo e aparece imediatamente na listagem
6. Scripts afterSave sao executados (se configurados)

**Fluxos alternativos:**

- _Campo obrigatorio vazio:_ Sistema bloqueia salvamento e destaca o campo
- _Edicao:_ Dados devem ser preservados corretamente (ex.: senha nao deve sumir apos edicao)
- _Bulk operations:_ Multiplos registros podem ser enviados para lixeira ou restaurados de uma vez

---

### UC-04 – Controlar Acesso de Usuarios e Grupos

**Ator:** Administrador (master)
**Pre-condicao:** Usuario com perfil de administrador
**Fluxo principal:**

1. Administrador acessa o modulo de Permissoes
2. Cria ou edita usuarios e grupos
3. Define permissoes por grupo (12 permissoes: CREATE/UPDATE/REMOVE/VIEW para TABLE/FIELD/ROW)
4. Associa usuarios a grupos com role (MASTER, ADMINISTRATOR, MANAGER, REGISTERED)

**Fluxos alternativos:**

- _Alteracao de senha:_ Sessoes ativas do usuario sao invalidadas apos a troca

---

### UC-05 – Autenticar no Sistema

**Ator:** Qualquer usuario
**Pre-condicao:** Usuario cadastrado (ou via sign-up)
**Fluxo principal:**

1. Usuario acessa a tela de login
2. Informa email e senha
3. Sistema valida e redireciona para a rota padrao do role

**Fluxos alternativos:**

- _Credenciais invalidas:_ Mensagem de erro exibida
- _Esqueci a senha:_ Fluxo de recuperacao via email (request-code + validate-code + reset-password)
- _Magic link:_ Login via link enviado por email
- _Sign-up:_ Cadastro de nova conta
- _Espaco extra:_ Sistema deve ignorar espacos desnecessarios
- _Token expirado:_ Refresh token renova automaticamente

---

### UC-06 – Clonar Tabela

**Ator:** Usuario autenticado
**Pre-condicao:** Ao menos uma tabela configurada como modelo (via Settings)
**Fluxo principal:**

1. Usuario acessa a ferramenta "Clonar Lista" (modulo Tools)
2. Seleciona o modelo base no dropdown (tabelas de MODEL_CLONE_TABLES)
3. Informa o nome da nova tabela
4. Sistema cria a nova tabela com a mesma estrutura (sem registros)

**Fluxos alternativos:**

- _Sem modelo base:_ Sistema exibe erro de validacao
- _Nome duplicado:_ Sistema rejeita com mensagem especifica
- _Campos na lixeira:_ Nao devem ser incluidos na clonagem

---

### UC-07 – Gerenciar Menus

**Ator:** Administrador
**Pre-condicao:** Usuario autenticado como administrador
**Fluxo principal:**

1. Administrador acessa o modulo de Menus
2. Cria um menu informando nome, slug e tipo (TABLE, PAGE, FORM, EXTERNAL, SEPARATOR)
3. Para TABLE/FORM: seleciona tabela vinculada
4. Para EXTERNAL: informa URL
5. Para PAGE: insere conteudo HTML
6. Pode definir menu pai para hierarquia
7. Menu aparece na listagem e fica disponivel para navegacao
8. Acesso ao menu redireciona para a tabela/pagina/URL respeitando permissoes

**Fluxos alternativos:**

- _Slug duplicado:_ Sistema rejeita com mensagem especifica
- _Nome vazio:_ Sistema exibe erro de validacao
- _Reordenacao:_ Menus podem ser reordenados via drag-and-drop
- _Exclusao:_ Menu pode ser enviado para lixeira, restaurado ou excluido permanentemente

---

### UC-08 – Visualizar Lista em Diferentes Modelos

**Ator:** Usuario autenticado (ou publico, dependendo da visibilidade)
**Pre-condicao:** Lista com registros
**Fluxo principal:**

1. Usuario acessa uma lista
2. O modelo de visualizacao e definido na configuracao da tabela (style)
3. Sistema renderiza os registros no modelo escolhido
4. Usuario clica em um item e abre o registro completo

**Modelos disponiveis:**
- Lista, Card, Documento, Mosaico, Galeria, Kanban, Forum, Calendario, Gantt

---

### UC-09 – Gerenciar Grupos de Campos

**Ator:** Usuario autenticado
**Pre-condicao:** Lista existente
**Fluxo principal:**

1. Usuario cria um grupo de campos e associa campos a ele
2. Grupo aparece na visualizacao de registros da lista
3. Usuario pode editar nome e campos do grupo
4. Usuario pode filtrar registros por grupo
5. Dentro do grupo, e possivel fazer CRUD de linhas (sub-registros)

**Fluxos alternativos:**

- _Edicao de nome:_ Sistema deve persistir mudanca visualmente e no banco
- _Exclusao:_ Grupo vai para lixeira e pode ser restaurado

---

### UC-10 – Usar Chat IA

**Ator:** Usuario autenticado
**Pre-condicao:** OPENAI_API_KEY configurada no backend
**Fluxo principal:**

1. Usuario abre o painel de chat
2. Envia mensagem de texto, imagem ou PDF
3. Sistema conecta via Socket.IO, processa com OpenAI e MCP
4. Resposta e exibida em tempo real com eventos de status

---

### UC-11 – Configurar Scripts de Tabela

**Ator:** Usuario autenticado
**Pre-condicao:** Lista existente
**Fluxo principal:**

1. Usuario acessa a configuracao de metodos da tabela
2. Escreve scripts no editor Monaco para onLoad, beforeSave e/ou afterSave
3. Scripts sao executados em sandbox com APIs expostas (field, context, email, utils, console)
4. Resultado retorna success/error com logs capturados

---

### UC-12 – Import/Export de Tabelas

**Ator:** Usuario autenticado
**Pre-condicao:** Ao menos uma tabela existente (para export)
**Fluxo principal:**

1. Usuario acessa o modulo de Ferramentas (Tools)
2. Seleciona importar ou exportar
3. Para export: sistema gera arquivo com estrutura e dados
4. Para import: sistema processa arquivo e cria tabela

---

### UC-13 – Gerenciar Perfil

**Ator:** Usuario autenticado
**Pre-condicao:** Usuario logado
**Fluxo principal:**

1. Usuario acessa a pagina de perfil
2. Visualiza e edita seus dados (nome, email, senha)
3. Alteracoes sao salvas e refletidas na interface

---

## 7. Servicos e APIs

### Servico de Autenticacao

| Operacao         | Metodo | Endpoint                      |
| ---------------- | ------ | ----------------------------- |
| Login            | POST   | `/authentication/sign-in`     |
| Cadastro         | POST   | `/authentication/sign-up`     |
| Logout           | POST   | `/authentication/sign-out`    |
| Refresh token    | POST   | `/authentication/refresh-token` |
| Magic link       | POST   | `/authentication/magic-link`  |
| Solicitar codigo | POST   | `/authentication/request-code` |
| Validar codigo   | POST   | `/authentication/validate-code` |
| Redefinir senha  | POST   | `/authentication/reset-password` |

### Servico de Perfil

| Operacao        | Metodo | Endpoint   |
| --------------- | ------ | ---------- |
| Obter perfil    | GET    | `/profile` |
| Atualizar perfil | PATCH | `/profile` |

### Servico de Listas (Tabelas)

| Operacao             | Metodo | Endpoint                           |
| -------------------- | ------ | ---------------------------------- |
| Criar tabela         | POST   | `/tables`                          |
| Listar paginado      | GET    | `/tables/paginated`                |
| Obter tabela         | GET    | `/tables/:_id`                     |
| Atualizar tabela     | PATCH  | `/tables/:_id`                     |
| Enviar para lixeira  | PATCH  | `/tables/:_id/send-to-trash`       |
| Restaurar da lixeira | PATCH  | `/tables/:_id/remove-from-trash`   |
| Excluir permanente   | DELETE | `/tables/:_id`                     |

### Servico de Campos

| Operacao             | Metodo | Endpoint                                  |
| -------------------- | ------ | ----------------------------------------- |
| Criar campo          | POST   | `/table-fields`                           |
| Obter campo          | GET    | `/table-fields/:_id`                      |
| Atualizar campo      | PATCH  | `/table-fields/:_id`                      |
| Enviar para lixeira  | PATCH  | `/table-fields/:_id/send-to-trash`        |
| Restaurar da lixeira | PATCH  | `/table-fields/:_id/remove-from-trash`    |
| Excluir permanente   | DELETE | `/table-fields/:_id`                      |
| Adicionar categoria  | POST   | `/table-fields/:_id/add-category`         |

### Servico de Registros (Rows)

| Operacao              | Metodo | Endpoint                                        |
| --------------------- | ------ | ----------------------------------------------- |
| Criar registro        | POST   | `/tables/:tableId/rows`                         |
| Listar paginado       | GET    | `/tables/:tableId/rows/paginated`               |
| Obter registro        | GET    | `/tables/:tableId/rows/:rowId`                  |
| Atualizar registro    | PATCH  | `/tables/:tableId/rows/:rowId`                  |
| Enviar para lixeira   | PATCH  | `/tables/:tableId/rows/:rowId/send-to-trash`    |
| Restaurar da lixeira  | PATCH  | `/tables/:tableId/rows/:rowId/remove-from-trash` |
| Excluir permanente    | DELETE | `/tables/:tableId/rows/:rowId`                  |
| Bulk enviar lixeira   | PATCH  | `/tables/:tableId/rows/bulk-trash`              |
| Bulk restaurar        | PATCH  | `/tables/:tableId/rows/bulk-restore`            |
| Reagir (like/unlike)  | POST   | `/tables/:tableId/rows/:rowId/reaction`         |
| Avaliar               | POST   | `/tables/:tableId/rows/:rowId/evaluation`       |
| Mensagem forum        | POST   | `/tables/:tableId/rows/:rowId/forum-message`    |

### Servico de Grupos de Campos

| Operacao             | Metodo | Endpoint                                  |
| -------------------- | ------ | ----------------------------------------- |
| Criar grupo          | POST   | `/group-fields`                           |
| Listar grupos        | GET    | `/group-fields`                           |
| Obter grupo          | GET    | `/group-fields/:_id`                      |
| Atualizar grupo      | PATCH  | `/group-fields/:_id`                      |
| Enviar para lixeira  | PATCH  | `/group-fields/:_id/send-to-trash`        |

### Servico de Linhas de Grupo

| Operacao       | Metodo | Endpoint               |
| -------------- | ------ | ---------------------- |
| Criar linha    | POST   | `/group-rows`          |
| Listar linhas  | GET    | `/group-rows`          |
| Obter linha    | GET    | `/group-rows/:_id`     |
| Atualizar linha | PATCH | `/group-rows/:_id`     |
| Excluir linha  | DELETE | `/group-rows/:_id`     |

### Servico de Usuarios

| Operacao         | Metodo | Endpoint              |
| ---------------- | ------ | --------------------- |
| Criar usuario    | POST   | `/users`              |
| Listar paginado  | GET    | `/users/paginated`    |
| Obter usuario    | GET    | `/users/:_id`         |
| Atualizar usuario | PATCH | `/users/:_id`         |

### Servico de Grupos de Usuario

| Operacao        | Metodo | Endpoint                    |
| --------------- | ------ | --------------------------- |
| Criar grupo     | POST   | `/user-groups`              |
| Listar grupos   | GET    | `/user-groups`              |
| Listar paginado | GET    | `/user-groups/paginated`    |
| Obter grupo     | GET    | `/user-groups/:_id`         |
| Atualizar grupo | PATCH  | `/user-groups/:_id`         |

### Servico de Permissoes

| Operacao          | Metodo | Endpoint       |
| ----------------- | ------ | -------------- |
| Listar permissoes | GET    | `/permissions` |

### Servico de Menus

| Operacao             | Metodo | Endpoint                         |
| -------------------- | ------ | -------------------------------- |
| Criar menu           | POST   | `/menus`                         |
| Listar menus         | GET    | `/menus`                         |
| Listar paginado      | GET    | `/menus/paginated`               |
| Obter menu           | GET    | `/menus/:_id`                    |
| Atualizar menu       | PATCH  | `/menus/:_id`                    |
| Reordenar menus      | PATCH  | `/menus/reorder`                 |
| Enviar para lixeira  | PATCH  | `/menus/:_id/send-to-trash`      |
| Restaurar da lixeira | PATCH  | `/menus/:_id/restore`            |
| Excluir permanente   | DELETE | `/menus/:_id/hard-delete`        |

### Servico de Paginas

| Operacao     | Metodo | Endpoint        |
| ------------ | ------ | --------------- |
| Obter pagina | GET    | `/pages/:slug`  |

### Servico de Storage

| Operacao        | Metodo | Endpoint          |
| --------------- | ------ | ----------------- |
| Upload arquivo  | POST   | `/storage`        |
| Excluir arquivo | DELETE | `/storage/:_id`   |

### Servico de Configuracoes

| Operacao                | Metodo | Endpoint    |
| ----------------------- | ------ | ----------- |
| Obter configuracoes     | GET    | `/settings` |
| Atualizar configuracoes | PATCH  | `/settings` |

### Servico de Ferramentas (Tools)

| Operacao        | Metodo | Endpoint              |
| --------------- | ------ | --------------------- |
| Importar tabela | POST   | `/tools/import-table` |
| Exportar tabela | POST   | `/tools/export-table` |
| Clonar tabela   | POST   | `/tools/clone-table`  |

### Outros

| Operacao     | Metodo | Endpoint         |
| ------------ | ------ | ---------------- |
| Health check | GET    | `/health-check`  |
| Documentacao | GET    | `/documentation` |
| OpenAPI spec | GET    | `/openapi.json`  |

---

## 8. Modelo de Dominio (Entidades)

```
Table (Lista)
├── _id
├── name (string, max 40)
├── slug (string, unique)
├── description (string)
├── type (TABLE | FIELD_GROUP)
├── style (LIST | GALLERY | DOCUMENT | CARD | MOSAIC | KANBAN | FORUM | CALENDAR | GANTT)
├── visibility (PUBLIC | RESTRICTED | OPEN | FORM | PRIVATE)
├── collaboration (OPEN | RESTRICTED)
├── _schema (Mixed — schema dinamico para Mongoose em runtime)
├── methods {onLoad, beforeSave, afterSave} (scripts de usuario)
├── groups[] (grupos de campos)
├── order (integer)
├── layoutFields {title, description, cover} (campos de layout para cards)
├── owner → User
├── administrators[] → User
├── logo → Storage
├── createdBy → User
├── createdAt (datetime)
├── trashed (boolean)
├── trashedAt (datetime, nullable)
├── fields[] → Field
└── rows[] → Row

Field (Campo)
├── _id
├── tableId → Table
├── name (string)
├── slug (string)
├── type (TEXT_SHORT | TEXT_LONG | DROPDOWN | DATE | RELATIONSHIP | FILE | FIELD_GROUP | CATEGORY | REACTION | EVALUATION | USER | CREATOR | IDENTIFIER | CREATED_AT | TRASHED | TRASHED_AT)
├── format (ALPHA_NUMERIC | INTEGER | DECIMAL | URL | EMAIL | PASSWORD | PHONE | CNPJ | CPF | RICH_TEXT | PLAIN_TEXT | 12 date formats)
├── required (boolean)
├── multiple (boolean)
├── locked (boolean)
├── native (boolean)
├── defaultValue (Mixed)
├── showInFilter (boolean)
├── showInForm (boolean)
├── showInDetail (boolean)
├── showInList (boolean)
├── widthInForm (string)
├── widthInList (string)
├── widthInDetail (string)
├── order (integer)
├── relationship {table → Table, field → Field, displayOrder}
├── dropdown[] {label, value, color, order}
├── category[] (hierarquia de categorias)
├── fieldGroup → FieldGroup
├── trashed (boolean)
├── trashedAt (datetime, nullable)
├── createdAt (datetime)
└── updatedAt (datetime)

Row (Registro)
├── _id
├── tableId → Table
├── [campos dinamicos conforme _schema da tabela]
├── trashed (boolean)
├── trashedAt (datetime, nullable)
├── createdAt (datetime)
└── updatedAt (datetime)

User (Usuario)
├── _id
├── name (string)
├── email (string, unique)
├── password (string, hash)
├── status (ACTIVE | INACTIVE)
├── groups[] → UserGroup
├── createdAt (datetime)
└── updatedAt (datetime)

UserGroup (Grupo de Permissao)
├── _id
├── name (string)
├── slug (string)
├── description (string)
├── permissions[] → Permission
├── trashed (boolean)
└── trashedAt (datetime, nullable)

Permission (Permissao)
├── _id
├── name (string)
├── slug (string — CREATE_TABLE, UPDATE_TABLE, REMOVE_TABLE, VIEW_TABLE, CREATE_FIELD, UPDATE_FIELD, REMOVE_FIELD, VIEW_FIELD, CREATE_ROW, UPDATE_ROW, REMOVE_ROW, VIEW_ROW)
└── description (string)

Menu
├── _id
├── name (string)
├── slug (string, unique)
├── type (TABLE | PAGE | FORM | EXTERNAL | SEPARATOR)
├── table → Table (nullable)
├── parent → Menu (self-ref, nullable — hierarquia)
├── url (string, nullable — para EXTERNAL)
├── html (string, nullable — para PAGE)
├── owner → User
├── order (integer)
├── createdBy → User
├── createdAt (datetime)
├── trashed (boolean)
└── trashedAt (datetime, nullable)

Storage (Arquivo)
├── _id
├── filename (string)
├── mimetype (string)
├── size (number)
├── originalName (string)
├── createdAt (datetime)
└── url (virtual — gerada em runtime)

Reaction (Reacao)
├── _id
├── type (LIKE | UNLIKE)
├── user → User
├── createdAt (datetime)
└── updatedAt (datetime)

Evaluation (Avaliacao)
├── _id
├── value (number)
├── user → User
├── createdAt (datetime)
└── updatedAt (datetime)

ValidationToken
├── _id
├── code (string)
├── status (REQUESTED | EXPIRED | VALIDATED)
├── user → User
├── createdAt (datetime)
└── updatedAt (datetime)

Setting (Configuracoes — documento unico)
├── SYSTEM_NAME (string)
├── LOCALE (pt-br | en-us)
├── STORAGE_DRIVER (local | s3)
├── FILE_UPLOAD_MAX_SIZE (number, bytes)
├── FILE_UPLOAD_ACCEPTED (string, MIME types separados por ;)
├── FILE_UPLOAD_MAX_FILES_PER_UPLOAD (number)
├── PAGINATION_PER_PAGE (number)
├── MODEL_CLONE_TABLES[] → Table
├── LOGO_SMALL_URL (string)
├── LOGO_LARGE_URL (string)
├── EMAIL_PROVIDER_HOST (string)
├── EMAIL_PROVIDER_PORT (number)
├── EMAIL_PROVIDER_USER (string)
└── EMAIL_PROVIDER_PASSWORD (string)
```

---

## 9. Pendencias e Melhorias Identificadas

| ID  | Tipo        | Descricao                                                                         | Status |
| --- | ----------- | --------------------------------------------------------------------------------- | ------ |
| P01 | ❌ Bug      | Campo Password perde o valor apos edicao de registro                              | Aberto |
| P02 | ❌ Bug      | Campo URL nao trunca texto longo na exibicao (falta "...")                        | Aberto |
| P03 | ❌ Bug      | Modelos Mosaico e Galeria apresentam erro ao abrir registros                      | Aberto |
| P04 | ❌ Bug      | Edicao do nome de Grupo de Campos salva no banco mas nao reflete na interface     | Aberto |
| P05 | ❌ Bug      | Clonagem de tabela inclui campos da lixeira indevidamente                         | Aberto |
| P06 | ❌ Bug      | Campo Data nao possui filtro por periodo implementado                             | Aberto |
| P07 | ❌ Bug      | Exibicao de campos ("Exibir na lista") apresenta bug visual                       | Aberto |
| P08 | ❌ Ausente  | Nao ha opcao de excluir grupo de permissao                                        | Aberto |
| P09 | ✅ Resolvido | ~~Nao ha opcao de excluir menu~~ — Backend possui trash/restore/hard-delete       | Implementado |
| P10 | ❌ Ausente  | Campo Relacionamento: consulta por relacionamento nao existe ou nao funciona      | Aberto |
| P11 | ❌ Ausente  | Nao ha botao de compartilhar link na listagem de tabelas                          | Aberto |
| P12 | ⚠️ Ajuste   | Alterar senha nao invalida sessao ativa do usuario                                | Aberto |
| P13 | ⚠️ Ajuste   | Ortografia incorreta: "Acoes" precisa ser corrigida                               | Aberto |
| P14 | ⚠️ Ajuste   | Busca de listas e restrita a pagina atual — deve ser global                       | Aberto |
| P15 | ⚠️ Ajuste   | Textos e labels em ingles precisam ser traduzidos para portugues                  | Aberto |
| P16 | 🆕 Melhoria | Campo enviado para lixeira deve ser automaticamente definido como nao obrigatorio | Aberto |
| P17 | 🆕 Melhoria | Fluxo de restauracao de grupos de campos da lixeira precisa ser implementado      | Aberto |
