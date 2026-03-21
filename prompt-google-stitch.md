# Prompt Google Stitch - Plataforma Low-Code de Gerenciamento de Dados

## INSTRUCOES GERAIS

Gere TODAS as telas descritas abaixo como uma aplicacao web responsiva e moderna. Cada tela deve ser pixel-perfect seguindo as especificacoes de design system abaixo. A aplicacao e em portugues brasileiro (pt-BR). Todas as telas devem estar conectadas entre si com navegacao funcional.

---

## DESIGN SYSTEM

### Cores (Light Mode)
- Background: branco (#FFFFFF)
- Foreground (texto): azul-escuro quase preto (#1A1A2E)
- Primary (botoes, links, destaques): azul (#2563EB)
- Primary Foreground: branco off-white (#F0F4FF)
- Secondary: cinza claro (#F5F5F5)
- Secondary Foreground: cinza escuro (#2D2D3F)
- Muted: cinza claro (#F5F5F5)
- Muted Foreground: cinza medio (#71717A)
- Destructive: vermelho (#DC2626)
- Border: cinza claro (#E5E5E5)
- Input border: cinza claro (#E5E5E5)
- Card: fundo branco, borda cinza, shadow-sm
- Sidebar: quase branco (#FAFAFA), borda cinza claro
- Sidebar Primary: azul (#4F46E5)

### Cores (Dark Mode)
- Background: cinza escuro (#1A1A2E)
- Foreground: off-white (#FAFAFA)
- Card: cinza mais escuro (#2D2D3F)
- Border: branco 10% opacidade
- Input: branco 15% opacidade
- Destructive: vermelho claro (#F87171)

### Cores da Marca
- Laranja: #D97706 (brand-orange)
- Azul escuro: #1E3A5F (brand-blue-dark)
- Azul medio: #2563EB (brand-blue-mid)

### Tipografia
- Font family: Geist Sans (sans-serif system fallback)
- Font mono: Geist Mono
- Tamanhos: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)

### Border Radius
- Base: 10.4px (0.65rem)
- sm: 6.4px
- md: 8.4px
- lg: 10.4px
- xl: 14.4px

### Shadows
- shadow-xs: sutil
- shadow-sm: leve (cards)
- shadow-md: medio (dropdowns, popovers)
- shadow-lg: forte (modais, dialogs)

### Breakpoints Responsivos
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

---

## COMPONENTES BASE (reutilizar em todas as telas)

### Button
Variantes:
- **default**: fundo azul primary, texto branco, hover opacity 90%
- **destructive**: fundo vermelho, texto branco
- **outline**: borda cinza, fundo transparente, hover cinza claro
- **secondary**: fundo cinza claro, texto escuro
- **ghost**: sem fundo, hover cinza claro
- **link**: texto azul, sublinhado

Tamanhos:
- **default**: altura 36px, padding horizontal 16px
- **sm**: altura 32px, padding horizontal 12px
- **lg**: altura 40px, padding horizontal 24px
- **icon**: 36x36px quadrado
- **icon-sm**: 32x32px quadrado

### Badge
- Inline flex, border-radius 4px, padding 4px 8px, font 12px medium
- Variantes: default (azul), secondary (cinza), destructive (vermelho), outline (borda)

### Card
- Fundo branco, borda cinza, border-radius 12px, shadow-sm, padding 24px
- Secoes: CardHeader, CardTitle (font-semibold), CardDescription (cinza medio), CardContent, CardFooter

### Input
- Altura 36px, border-radius 8px, borda cinza, padding 12px, fundo transparente
- Placeholder cinza medio, focus: anel azul 3px

### InputGroup
- Agrupa Input com icones (addon esquerdo/direito) e botoes inline
- Icone esquerdo dentro do campo, botao direito para acoes (ex: toggle senha)

### Dialog/Modal
- Overlay escuro 50% opacidade
- Conteudo centralizado, max-width 512px, border-radius 8px, padding 24px, shadow-lg
- Header com titulo e botao X para fechar
- Animacao: fade-in + zoom-in

### Select/Dropdown
- Trigger: altura 36px, borda cinza, border-radius 8px
- Content: min-width 128px, border-radius 8px, shadow-md
- Items: padding 8px, hover cinza claro

### Tabs
- Lista de tabs: fundo cinza claro, border-radius 8px, padding 3px
- Tab ativa: fundo branco, shadow-sm
- Tab inativa: texto cinza

### Table (Data Table)
- Header: altura 40px, texto alinhado a esquerda, font-medium, cinza
- Rows: borda inferior, hover cinza claro
- Cells: padding 8px, texto nowrap

### Combobox
- Input com busca + lista dropdown filtrada
- Suporte a selecao unica e multipla (com chips)
- Icone ChevronDown no trigger

### Pagination
- Layout flex: seletor items/pagina (10, 20, 50) | texto "Pagina X de Y" | botoes First/Prev/Next/Last
- Botoes: variante ghost, tamanho icon
- Icones: ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight

### Spinner
- Icone Loader2 com animacao rotate continua
- Usado dentro de botoes durante loading

### Tooltip
- Pequeno popover preto com texto branco, aparece no hover

### Sheet
- Painel lateral deslizante (mobile), overlay escuro
- Usado para filtros em mobile

### Skeleton
- Retangulo cinza animado (shimmer) para estados de loading

---

## LAYOUT PRINCIPAL (aplicado a TODAS as paginas autenticadas)

### Sidebar (Navegacao lateral)
- **Largura**: 256px (desktop), 288px (mobile), 48px (colapsada)
- **Toggle**: Ctrl+B ou botao hamburger
- **Estrutura**:
  - Topo: Logo da aplicacao (imagem carregada do backend)
  - Corpo: Menu hierarquico recursivo (ate 4 niveis de profundidade)
    - Cada item: icone + texto + chevron se tem filhos
    - Itens colapsaveis com animacao
    - Item ativo: fundo azul claro, texto azul
    - Tipos de item: link para tabela, link para pagina, link externo, separador
  - Rodape: Botao "Sair" com icone LogOut
- **Mobile**: overlay deslizante da esquerda (Sheet)
- **Desktop**: sidebar fixa com rail para redimensionar

### Header (Barra superior)
- **Altura**: auto com padding vertical 16px
- **Estrutura** (flex, justify-between):
  - Esquerda: Botao toggle sidebar (32x32px, icone PanelLeft)
  - Centro: Campo de busca global (InputGroup com icone Search, placeholder "Pesquisar...", busca no Enter)
  - Direita: Dropdown do perfil OU botao "Entrar" (se nao autenticado)
- **Busca global**: atualiza URL params, botao X para limpar
- **Algumas rotas sem busca**: dashboard, groups, menus, profile, settings, criacao de registros

### Dropdown do Perfil
- Trigger: Avatar circular com iniciais do usuario (2 letras, fundo primary, texto branco)
- Conteudo:
  - Nome e email do usuario
  - Separador
  - Link "Perfil" com icone UserIcon
  - Botao "Sair" com icone LogOut (spinner durante logout)

### Area de Conteudo
- Flex column, height 100vh, overflow hidden
- Estrutura padrao de todas as paginas:
  ```
  +-----------------------------------+
  | Header da Pagina (shrink-0)       |
  | border-bottom, padding 8px        |
  +-----------------------------------+
  |                                   |
  | Conteudo (flex-1, overflow-auto)  |
  |                                   |
  +-----------------------------------+
  | Footer/Pagination (shrink-0)      |
  | border-top, padding 8px           |
  +-----------------------------------+
  ```

---

## TELA 1: LOGIN

**Rota**: `/`
**Acesso**: Publico (redireciona para dashboard se ja autenticado)
**Layout**: SEM sidebar, SEM header. Tela cheia centralizada.

**Estrutura**:
- Fundo: cor background
- Container centralizado vertical e horizontal, min-height 100vh
- Largura maxima: 384px (max-w-sm)
- Espacamento: gap 24px, padding 24px (mobile), 40px (desktop)

**Conteudo**:
1. **Logo** centralizado no topo (altura 32px)
2. **Texto**: "Nao possui uma conta? [Clique aqui]" (link sublinhado para /sign-up)
3. **Campo E-mail**:
   - Label: "E-mail"
   - InputGroup com icone MailIcon a direita
   - Placeholder: "exemplo@mail.com"
   - Validacao: formato de email valido
   - Erro: "Digite um email valido"
4. **Campo Senha**:
   - Label: "Senha"
   - InputGroup com icone LockIcon a direita
   - Botao toggle visibilidade (EyeIcon/EyeClosedIcon) no canto direito interno
   - Placeholder: "--------"
   - Type: password (toggle para text)
   - Validacao: obrigatorio
   - Erro: "A senha e obrigatoria"
5. **Botao Submit**:
   - Texto: "Entrar"
   - Largura: 100%
   - Variante: default (azul)
   - Loading: Spinner + "Entrar" durante requisicao
   - Desabilitado durante loading

**Comportamento**:
- No sucesso: redireciona baseado no papel do usuario (MASTER -> /dashboard, outros -> /tables)
- Toast de sucesso: "Login realizado com sucesso!" / "Seja bem-vindo!"
- No erro: exibe erros nos campos ou toast generico

---

## TELA 2: CADASTRO

**Rota**: `/sign-up`
**Acesso**: Publico
**Layout**: SEM sidebar, SEM header. Tela cheia centralizada (identico ao login).

**Estrutura**: Mesma do login (container centralizado, max-w-sm)

**Conteudo**:
1. **Logo** centralizado
2. **Texto**: "Ja possui uma conta? [Faca login]" (link para /)
3. **Campo Nome**:
   - Label: "Nome"
   - InputGroup com icone UserIcon
   - Placeholder: "Seu nome completo"
   - Validacao: obrigatorio
4. **Campo E-mail**:
   - Label: "E-mail"
   - InputGroup com icone MailIcon
   - Placeholder: "exemplo@mail.com"
   - Validacao: email valido
5. **Campo Senha**:
   - Label: "Senha"
   - InputGroup com icone LockIcon + toggle visibilidade
   - Placeholder: "--------"
   - Validacao: minimo 6 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 caractere especial
   - Erro: "A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial"
6. **Campo Confirmar Senha**:
   - Label: "Confirmar Senha"
   - InputGroup com icone LockIcon + toggle visibilidade independente
   - Placeholder: "--------"
   - Validacao: deve ser igual ao campo senha
   - Erro: "As senhas nao coincidem"
7. **Botao Submit**:
   - Texto: "Criar conta"
   - Largura: 100%
   - Loading: Spinner durante requisicao

**Comportamento**:
- Sucesso: redireciona para / (login)
- Erro "USER_ALREADY_EXISTS": mostra "Este email ja esta em uso" no campo email

---

## TELA 3: DASHBOARD

**Rota**: `/dashboard`
**Acesso**: Autenticado (todos os papeis)
**Layout**: Com sidebar + header (busca global oculta nesta rota)

**Header da Pagina**:
- H1: "Dashboard" (text-2xl, font-semibold)
- Padding 16px, border-bottom

**Conteudo** (overflow-auto, padding 16px, espacamento vertical 16px):

1. **Grid de StatCards** (1 coluna mobile, 2 colunas tablet, 4 colunas desktop, gap 16px):
   - **Card "Total Tabelas"**: icone TableIcon, valor numerico grande, fundo card
   - **Card "Total Usuarios"**: icone UsersIcon, valor numerico
   - **Card "Total Registros"**: icone RowsIcon, valor numerico
   - **Card "Usuarios Ativos"**: icone ActivityIcon, valor numerico + percentual

   Cada StatCard:
   - Componente Card com CardHeader (titulo + icone) e CardContent (valor grande, font-bold text-2xl)

2. **Grid de Charts** (1 coluna mobile, 2 colunas desktop, gap 16px):
   - **ChartTables**: Grafico de barras/pizza mostrando distribuicao de tabelas
   - **ChartUsers**: Grafico mostrando distribuicao de usuarios por grupo/papel
   - Usar biblioteca Recharts (barras coloridas, legendas, tooltips)

3. **Secao RecentActivity**:
   - Card com lista de atividades recentes
   - Cada item: icone + descricao + timestamp
   - Scroll se necessario

---

## TELA 4: LISTA DE TABELAS

**Rota**: `/tables`
**Acesso**: Autenticado
**Layout**: Com sidebar + header (busca global ativa)

**Header da Pagina** (flex, justify-between, padding 8px, border-bottom):
- Esquerda: H1 "Tabelas" (text-2xl, font-medium)
- Direita (inline-flex, gap 8px):
  - **Botao Lixeira** (TrashButton): icone Trash2, variante outline, toggle estado lixeira. Quando ativo: "Sair da lixeira", icone rotaciona 180 graus. Visivel se tem permissao REMOVE_TABLE.
  - **Botao Filtro** (FilterTrigger): icone SlidersHorizontal, variante outline, badge vermelho com contagem de filtros ativos posicionado no canto superior direito
  - **Botao Importar CSV**: icone UploadIcon, variante outline, abre dialog de importacao. Visivel se tem permissao CREATE_TABLE.
  - **Botao "Nova Tabela"**: variante default (azul), navega para /tables/create. Visivel se tem permissao CREATE_TABLE.

**Conteudo** (flex-1, flex-row):
- **Sidebar de Filtros** (280px de largura, animacao slide):
  - Desktop: painel lateral fixo com animacao de abertura (w-0 -> w-[280px])
  - Mobile: Sheet deslizante
  - Campos de filtro:
    - "Nome" (input texto)
    - "Visibilidade" (dropdown multiplo: PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE)
    - "Criado por" (input texto)
  - Botoes no rodape: "Limpar" (ghost) + "Filtrar" (default)

- **Tabela Principal** (flex-1, overflow-auto):
  - Colunas: Nome (link clicavel), Slug, Visibilidade (badge), Tipo, Dono, Criado em (data formatada dd/MM/yyyy)
  - Cada coluna tem sorting (clique no header)
  - Rows com hover cinza claro
  - Links nas rows navegam para /tables/{slug}

**Footer** (shrink-0, border-top, padding 8px):
- Componente Pagination: seletor 10/20/50 items | "Pagina X de Y" | botoes navegacao

---

## TELA 5: DETALHE DA TABELA (9 Modos de Visualizacao)

**Rota**: `/tables/{slug}`
**Acesso**: Autenticado (ou publico se tabela e PUBLIC)
**Layout**: Com sidebar + header

**Header da Pagina** (flex, justify-between, padding 8px, border-bottom):
- Esquerda (inline-flex, gap 8px):
  - Botao voltar (ghost, icon-sm, icone ArrowLeft) -> navega para /tables
  - H1: nome da tabela (text-2xl, font-medium)
  - Botao compartilhar (ghost, icone Share2) -> copia URL para clipboard com toast

- Direita (inline-flex, gap 8px):
  - **FilterTrigger** (se tabela tem campos filtraveis)
  - **TrashButton** (se permissao UPDATE_ROW)
  - **TableStyleViewDropdown**: dropdown com 9 opcoes de visualizacao, cada uma com icone:
    - LIST (icone List), GALLERY (icone LayoutGrid), DOCUMENT (icone FileText), CARD (icone CreditCard), MOSAIC (icone LayoutDashboard), KANBAN (icone Columns), CALENDAR (icone Calendar), FORUM (icone MessageSquare), GANTT (icone GanttChart)
  - **Botao Exportar**: variante outline, abre dialog de exportacao (CSV/PDF)
  - **TableConfigurationDropdown**: icone Settings, dropdown com links para: "Detalhes da tabela", "Gerenciar campos", "Metodos da tabela"
  - **Botao "Registro"**: variante default, icone Plus, navega para /tables/{slug}/row/create. Visivel se permissao CREATE_ROW.

**Conteudo** (flex-1, flex-row):
- Sidebar de filtros (mesma do lista, mas com campos dinamicos baseados nos campos da tabela)
- Area de visualizacao (flex-1, overflow-auto)

### MODO LIST (Tabela com dados)
- DataTable com colunas dinamicas
- Checkbox de selecao na primeira coluna (se permissao trash)
- Colunas dinamicas baseadas nos campos da tabela
- Cada tipo de campo tem renderizacao especifica:
  - **TEXT_SHORT**: texto simples, truncado. Formatos: EMAIL (link mailto), URL (link externo), PASSWORD (*****)
  - **TEXT_LONG**: preview de texto, suporta rich text e markdown
  - **DATE**: formatado com locale pt-BR (ex: "15/03/2024 14:30")
  - **DROPDOWN**: badges coloridos com as opcoes selecionadas
  - **CATEGORY**: badges similares ao dropdown
  - **FILE**: lista de links de arquivos, thumbnails para imagens
  - **RELATIONSHIP**: badges com valores do registro relacionado
  - **EVALUATION**: 5 estrelas interativas (rating), mostra media
  - **REACTION**: botoes like/dislike com contagem
  - **USER**: nomes/emails separados por virgula
  - **FIELD_GROUP**: badge com contagem de itens
- Ultima coluna: acoes (dropdown com Editar, Lixeira, Restaurar, Excluir)
- Header da ultima coluna: botao "+ Field" para criar campo (se permissao)
- Selecao multipla: barra de acoes em massa aparece no bottom (sticky)
- Colunas redimensionaveis (drag handle), reordenaveis (drag header)
- Sorting por coluna

### MODO GALLERY (Grid de cards com imagem)
- Grid: 1 col (mobile), 2 cols (md), 3 cols (lg), 4 cols (xl)
- Cada card:
  - Imagem de capa no topo (do campo FILE tipo imagem) ou placeholder "sem imagem" (cinza claro)
  - Abaixo: campos da tabela em grid 2 colunas (label: valor)
  - Click navega para edicao do registro
- Ultimo card: botao "+" (dashed border) para criar novo registro

### MODO DOCUMENT (Documento hierarquico)
- Layout 2 paineis:
  - **Sidebar esquerda** (redimensionavel, 180px-600px):
    - Arvore de categorias com expand/collapse
    - Drag-and-drop para reordenar
    - Edicao inline de nomes
    - Botao "+" para adicionar categoria (abre dialog)
    - Icones: ChevronRight (colapsado), ChevronDown (expandido)
  - **Area principal** (flex-1):
    - Lista de registros agrupados por categoria
    - Cada registro: titulo (h2-h6 dinamico), corpo (rich text), campos extras em secao colapsavel "Mais info"
    - Botoes por registro: editar, adicionar sub-registro
    - Contagem de itens filtrados no topo
- Toolbar extra: botao imprimir (icone Printer), exportar PDF

### MODO CARD (Cards horizontais)
- Lista de cards horizontais (largura total):
  - Thumbnail 200px a esquerda (campo FILE)
  - Conteudo a direita: titulo, descricao, campos extras em grid 2 colunas
  - Hover: fundo muted/30
  - Click: navega para detalhe do registro
- Placeholder "Sem titulo" se nao ha campo de titulo

### MODO MOSAIC (Grid tipo Pinterest)
- Grid de cards com layout tipo masonry/mosaico
- Cada card: imagem + campos sobrepostos
- Similar ao Gallery mas com layout irregular

### MODO KANBAN (Quadro de colunas)
- Colunas baseadas no campo DROPDOWN (geralmente "lista" ou "status")
- Cada coluna:
  - Header: nome da coluna + contagem de cards + cor customizavel
  - Botao "+" no header para criar card nesta coluna
  - Lista de KanbanCards arrastavel
- Coluna especial "Nao atribuido" para itens sem valor
- Cada KanbanCard:
  - Titulo (primeiro campo TEXT_SHORT)
  - Descricao truncada
  - Membros (avatares)
  - Datas (badges)
  - Progresso (barra ou estrelas)
  - Click: abre KanbanRowDialog (dialog detalhado)
- KanbanRowDialog:
  - Titulo editavel
  - Descricao com editor rich text
  - Secao de subtarefas (checklist)
  - Secao de comentarios
  - Campos extras
  - Acoes rapidas (mover, arquivar)
- Drag-and-drop entre colunas
- Botao "Adicionar lista" no final

### MODO CALENDAR (Calendario)
- Toolbar: botoes Semana/Mes/Agenda + navegacao de data (< Hoje >)
- **Vista Mensal**: grid 7x5/6 com dias, eventos como badges coloridos nas celulas
- **Vista Semanal**: timeline horizontal com slots de hora
- **Vista Agenda**: lista cronologica de eventos
- Campos mapeados: titulo, descricao, data inicio, data fim, cor, participantes
- Click em evento: abre dialog de detalhes/edicao
- Click em dia vazio: abre dialog de criacao

### MODO FORUM (Chat/Mensagens por canal)
- Layout 2 paineis:
  - **Sidebar esquerda**: lista de canais (baseados no campo DROPDOWN)
    - Cada canal: nome + badge de mensagens nao lidas
    - Botoes: adicionar canal, editar canal, deletar canal
  - **Area principal**:
    - Header: nome do canal + info
    - Lista de mensagens (scroll infinito, polling 5s)
    - Cada mensagem: avatar, nome, timestamp, conteudo, reacoes, anexos
    - Composer no rodape: textarea com mencao (@), botao enviar, upload de arquivos

### MODO GANTT (Timeline)
- Layout 2 paineis:
  - **Painel esquerdo**: lista de tarefas com nome, datas, progresso
  - **Timeline direita**: barras horizontais representando duracao
    - Header: meses/semanas/dias
    - Barras coloridas por tarefa
    - Drag para ajustar datas
    - Linhas de conexao entre dependencias
- Toolbar: zoom (dia/semana/mes), navegacao temporal

**Footer**: Pagination (apenas para LIST, GALLERY, CARD, MOSAIC)

---

## TELA 6: CONFIGURACAO DA TABELA

**Rota**: `/tables/{slug}/detail`
**Acesso**: Autenticado + permissao UPDATE_TABLE
**Layout**: Com sidebar + header

**Modos**: Show (visualizacao) e Edit (edicao)

**Header da Pagina**:
- Botao voltar -> /tables/{slug}
- H1: "Detalhes da tabela"
- Botoes (modo show):
  - "Enviar para lixeira" (destructive, se nao esta na lixeira)
  - "Restaurar" (outline, se esta na lixeira)
  - "Excluir permanentemente" (destructive, se esta na lixeira, com dialog de confirmacao)
  - "Editar" (default)

**Conteudo (modo show)** - exibicao read-only dos dados da tabela
**Conteudo (modo edit)** - formulario com campos:
- Nome (texto, obrigatorio, 1-40 chars)
- Descricao (textarea)
- Estilo de visualizacao (select: LIST, GALLERY, DOCUMENT, CARD, MOSAIC, KANBAN, FORUM, CALENDAR, GANTT)
- Visibilidade (select: PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE)
- Colaboracao (select: OPEN, RESTRICTED)
- Logo (upload de imagem)
- Administradores (multi-select de usuarios)
- Ordenacao (campo + direcao asc/desc)
- Layout Fields (mapeamento de campos para: titulo, descricao, capa, categoria, data inicio, data fim, cor, participantes, lembrete)

**Footer**:
- Modo show: "Voltar"
- Modo edit: "Cancelar" (ghost) + "Salvar" (default, com spinner)

---

## TELA 7: METODOS API DA TABELA

**Rota**: `/tables/{slug}/methods`
**Acesso**: Autenticado + permissao UPDATE_TABLE

**Header**: Botao voltar, H1 "Metodos da tabela"

**Conteudo**: Formulario com 3 campos de codigo (Code Editor estilo Monaco):
- **onLoad**: codigo executado ao carregar registros
- **beforeSave**: codigo executado antes de salvar
- **afterSave**: codigo executado depois de salvar

**Footer**: "Salvar Metodos" (default, com spinner)

---

## TELA 8: CRIAR CAMPO

**Rota**: `/tables/{slug}/field/create`
**Acesso**: Autenticado + permissao CREATE_FIELD

**Header**: Botao voltar, H1 "Novo campo" (ou "Novo grupo de campos")

**Conteudo** - Formulario:
- **Nome** (texto, obrigatorio)
- **Tipo** (select com icones):
  - TEXT_SHORT (icone Type), TEXT_LONG (icone AlignLeft), DROPDOWN (icone ChevronDown), DATE (icone Calendar), RELATIONSHIP (icone Link), FILE (icone Paperclip), FIELD_GROUP (icone Layers), REACTION (icone ThumbsUp), EVALUATION (icone Star), CATEGORY (icone Tag)
- **Configuracao dinamica por tipo**:
  - TEXT_SHORT: formato (Alfanumerico, Inteiro, Decimal, URL, Email, Senha, Telefone, CNPJ, CPF)
  - TEXT_LONG: formato (Texto Simples, Rich Text, Markdown)
  - DROPDOWN: lista de opcoes (adicionar/remover opcoes com label + cor)
  - DATE: formato de data (15 combinacoes: DD/MM/YYYY, MM/DD/YYYY, com/sem hora)
  - RELATIONSHIP: tabela referenciada + campo de exibicao
  - FILE: multiplo ou unico
  - FIELD_GROUP: nao disponivel dentro de outro grupo
  - CATEGORY: lista de categorias hierarquicas
- **Checkboxes**: Obrigatorio, Multiplo, Mostrar no filtro, Mostrar no formulario, Mostrar no detalhe, Mostrar na lista
- **Largura no formulario** (numero, %)
- **Largura na lista** (numero, px)
- **Valor padrao** (texto)

**Footer**: "Cancelar" (ghost) + "Criar" (default, spinner)

---

## TELA 9: GERENCIAR CAMPOS

**Rota**: `/tables/{slug}/field/management`
**Acesso**: Autenticado + permissao UPDATE_FIELD

**Header**: Botao voltar, H1 "Gerenciar campos" (ou nome do grupo)

**Conteudo**:
- **Tabs**: Lista | Filtros | Formularios | Detalhes | Lixeira (com badge de contagem)
- Cada tab mostra lista de campos com:
  - Toggle de visibilidade (switch on/off para a tab correspondente)
  - Drag-and-drop para reordenar campos
  - Cada campo: nome, tipo (badge), botoes editar/deletar
  - Botao "Novo campo" no topo

---

## TELA 10: EDITAR CAMPO

**Rota**: `/tables/{slug}/field/{fieldId}`
**Acesso**: Autenticado + permissao UPDATE_FIELD

**Modos**: Show/Edit (mesmo padrao das outras telas de detalhe)

**Conteudo**: Formulario igual ao de criacao, mas com valores preenchidos
- Campos bloqueados (locked): nao editaveis, mensagem informativa
- Campos na lixeira: nao editaveis
- Excecao: campos DROPDOWN bloqueados permitem edicao das opcoes

**Footer**: "Cancelar" + "Salvar"

---

## TELA 11: CRIAR REGISTRO

**Rota**: `/tables/{slug}/row/create`
**Acesso**: Autenticado + permissao CREATE_ROW

**Header**: Botao voltar -> /tables/{slug}, H1 "Novo registro"

**Conteudo** - Formulario dinamico baseado nos campos da tabela:
- Campos renderizados em flex-wrap
- Cada campo ocupa largura definida por widthInForm (padrao 50%)
- Apenas campos com showInForm: true
- Ordem definida por fieldOrderForm
- Renderizacao por tipo:
  - **TEXT_SHORT**: Input com icone baseado no formato (Email -> MailIcon, URL -> LinkIcon, etc.)
    - PASSWORD: campo senha com toggle visibilidade
    - INTEGER/DECIMAL: input numerico com validacao de teclas
  - **TEXT_LONG**:
    - PLAIN_TEXT: Textarea simples
    - RICH_TEXT: Editor TipTap com toolbar (negrito, italico, listas, links, imagens, tabelas, cores)
    - MARKDOWN: Editor com preview markdown
  - **DROPDOWN**: Combobox com opcoes, suporte a selecao multipla (chips) ou unica
  - **DATE**: Datepicker com input mascarado, calendario popup, seletor de mes/ano
  - **FILE**: Dropzone com drag-and-drop, lista de arquivos com barras de progresso, preview de imagens, botao remover
  - **RELATIONSHIP**: Combobox paginado com busca, carrega registros da tabela relacionada
  - **CATEGORY**: Seletor em arvore com checkboxes
  - **USER**: Multi-select de usuarios com busca e paginacao
  - **FIELD_GROUP**: Tabela inline com botao "Adicionar item", cada item e um sub-formulario com campos do grupo

- Cada campo mostra: Label (com asterisco vermelho se obrigatorio), Input, Mensagem de erro

**Footer**: "Cancelar" + "Salvar" (disabled durante upload de arquivos)

---

## TELA 12: EDITAR REGISTRO

**Rota**: `/tables/{slug}/row/{rowId}`
**Acesso**: Autenticado + permissao UPDATE_ROW (ou publico se tabela PUBLIC)

**Header**:
- Botao voltar (se autenticado) -> /tables/{slug}
- H1: "Detalhes do registro"
- Botao compartilhar

**Conteudo**: Formulario igual ao de criacao, mas com valores preenchidos

**Acoes** (botoes no formulario):
- "Atualizar" (default, com spinner)
- "Enviar para lixeira" (outline, abre dialog de confirmacao)
- "Restaurar" (outline, se esta na lixeira)
- "Excluir permanentemente" (destructive, abre dialog de confirmacao)

**Dialogs de confirmacao**: titulo, mensagem descritiva, botoes "Cancelar" + "Confirmar" (destructive)

---

## TELA 13: CRIAR TABELA

**Rota**: `/tables/create`
**Acesso**: Autenticado + permissao CREATE_TABLE

**Header**: Botao voltar, H1 "Nova tabela"

**Conteudo** - Formulario:
- **Nome** (texto, obrigatorio, 1-40 chars, regex: letras/numeros/espacos/hifen/underscore)
- **Logo** (upload de imagem)
- **Estilo de visualizacao** (select com os 9 estilos)
- **Visibilidade** (select: PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE)

**Footer**: "Cancelar" + "Criar" (disabled durante upload, spinner)

---

## TELA 14: CLONAR TABELA

**Rota**: `/tables/clone`
**Acesso**: Autenticado + permissao CREATE_TABLE

**Header**: Botao voltar, H1 "Criar nova tabela utilizando modelo"

**Conteudo**:
- **Seletor de tabela modelo** (Combobox paginado com busca)
- **Nome da nova tabela** (texto, obrigatorio)

**Footer**: "Cancelar" + "Criar" (spinner)

---

## TELA 15: LISTA DE USUARIOS

**Rota**: `/users`
**Acesso**: Restrito a MASTER e ADMINISTRATOR

**Header da Pagina**:
- H1: "Usuarios" (text-2xl, font-medium)
- Botoes: FilterTrigger, "Novo Usuario" (default, navega para /users/create)

**Conteudo** (FilterSidebar + Tabela):
- Filtro: campo "Nome" (busca por texto)
- Tabela com colunas: Nome, E-mail, Papel/Grupo (badge), Status (badge ACTIVE/INACTIVE), Criado em
- Sorting em todas as colunas
- Click na row navega para /users/{userId}

**Footer**: Pagination

---

## TELA 16: CRIAR USUARIO

**Rota**: `/users/create`
**Acesso**: MASTER e ADMINISTRATOR

**Header**: Botao voltar -> /users, H1 "Criar novo usuario"

**Conteudo** - Formulario:
- **Nome** (texto, obrigatorio)
- **E-mail** (email, obrigatorio)
- **Senha** (senha, obrigatorio, min 6 chars, 1 maiuscula, 1 minuscula, 1 numero, 1 especial)
- **Grupo/Papel** (Combobox seletor de grupo, obrigatorio)

**Footer**: "Cancelar" + "Criar" (spinner)

---

## TELA 17: EDITAR USUARIO

**Rota**: `/users/{userId}`
**Acesso**: MASTER e ADMINISTRATOR

**Modos**: Show/Edit

**Header**: Botao voltar -> /users, H1 "Detalhes do usuario", botao "Editar"

**Conteudo (modo edit)**:
- **Nome** (texto)
- **E-mail** (email)
- **Senha** (campo condicional - checkbox para habilitar alteracao)
- **Status** (select: ACTIVE, INACTIVE)
- **Grupo/Papel** (Combobox)

**Footer**: "Cancelar" + "Salvar"

---

## TELA 18: LISTA DE GRUPOS

**Rota**: `/groups`
**Acesso**: Restrito a MASTER e ADMINISTRATOR

**Header**: H1 "Grupos", FilterTrigger, "Novo Grupo" (default)

**Conteudo**: Filtro busca + Tabela com colunas: Nome, Descricao, Criado em
- Sorting nas colunas

**Footer**: Pagination

---

## TELA 19: CRIAR GRUPO

**Rota**: `/groups/create`
**Acesso**: MASTER e ADMINISTRATOR

**Header**: Botao voltar -> /groups, H1 "Criar novo grupo"

**Conteudo**:
- **Nome** (texto, obrigatorio)
- **Descricao** (textarea, opcional)
- **Permissoes** (multi-select com chips, obrigatorio, min 1):
  - Permissoes disponiveis: create-table, update-table, remove-table, view-table, create-field, update-field, remove-field, view-field, create-row, update-row, remove-row, view-row

**Footer**: "Cancelar" + "Criar"

---

## TELA 20: EDITAR GRUPO

**Rota**: `/groups/{groupId}`
**Acesso**: MASTER e ADMINISTRATOR

**Modos**: Show/Edit

**Conteudo (edit)**: Mesmo formulario do criar, com valores preenchidos

**Footer**: "Cancelar" + "Salvar"

---

## TELA 21: LISTA DE MENUS

**Rota**: `/menus`
**Acesso**: Restrito a MASTER e ADMINISTRATOR

**Header**: H1 "Gestao de Menus", TrashButton, FilterTrigger, "Novo Menu" (default)

**Conteudo**: Filtro busca + Tabela com colunas: Nome, Slug, Tipo (badge), Criado por, Criado em
- Sorting nas colunas

**Footer**: Pagination

---

## TELA 22: CRIAR MENU

**Rota**: `/menus/create`
**Acesso**: MASTER e ADMINISTRATOR

**Header**: Botao voltar -> /menus, H1 "Criar novo menu"

**Conteudo** - Formulario (campos condicionais baseados no tipo):
- **Nome** (texto, obrigatorio)
- **Tipo** (select: TABLE, PAGE, FORM, EXTERNAL, SEPARATOR)
- **Menu Pai** (Combobox hierarquico de menus, com breadcrumb, previne selecao de descendentes)
- **Tabela** (Combobox, visivel se tipo = TABLE ou FORM)
- **Conteudo HTML** (textarea/editor, visivel se tipo = PAGE)
- **URL** (texto, visivel se tipo = EXTERNAL)

**Footer**: "Cancelar" + "Criar"

---

## TELA 23: EDITAR MENU

**Rota**: `/menus/{menuId}`
**Acesso**: MASTER e ADMINISTRATOR

**Modos**: Show/Edit

**Botoes (modo show)**:
- "Enviar para lixeira" (se nao esta na lixeira)
- "Restaurar" (se na lixeira)
- "Excluir permanentemente" (se na lixeira, dialog de confirmacao)
- "Editar" (se nao na lixeira)

**Conteudo (edit)**: Mesmo formulario do criar com valores preenchidos

---

## TELA 24: PERFIL

**Rota**: `/profile`
**Acesso**: Autenticado (todos os papeis)

**Modos**: Show/Edit

**Header**: H1 "Perfil do usuario", botao "Editar"

**Conteudo (modo show)**: Exibicao read-only dos dados do usuario

**Conteudo (modo edit)**:
- **Nome** (texto, obrigatorio)
- **E-mail** (email, obrigatorio)
- **Grupo** (read-only, exibicao apenas)
- **Secao Alterar Senha** (checkbox para habilitar):
  - Senha atual (campo senha)
  - Nova senha (campo senha com validacao de forca)
  - Confirmar nova senha (deve ser igual)

**Footer**: "Cancelar" + "Salvar"

---

## TELA 25: CONFIGURACOES DO SISTEMA

**Rota**: `/settings`
**Acesso**: Restrito a MASTER apenas

**Modos**: Show/Edit

**Header**: H1 "Configuracoes do Sistema", botao "Editar"

**Conteudo (edit)** - Formulario extenso:
- **SYSTEM_NAME** (texto)
- **LOCALE** (select de idiomas)
- **Logo pequeno** (upload de imagem)
- **Logo grande** (upload de imagem)
- **Tamanho maximo de upload** (numero, em bytes)
- **Maximo de arquivos por upload** (numero)
- **Tipos de arquivo aceitos** (multi-select)
- **Items por pagina padrao** (numero)
- **Tabelas modelo para clone** (multi-select de tabelas)
- **Provedor de email - Host** (texto)
- **Provedor de email - Porta** (numero)
- **Provedor de email - Usuario** (texto)
- **Provedor de email - Senha** (senha)

**Footer**: "Cancelar" + "Salvar" (disabled durante upload)

---

## TELA 26: PAGINAS DINAMICAS

**Rota**: `/pages/{slug}`
**Acesso**: Autenticado

**Header**: H1 com nome da pagina (text-2xl, font-medium), border-bottom

**Conteudo**: Renderizacao de conteudo HTML
- Suporta rich text e formatacao

---

## TELA 27: FERRAMENTAS

**Rota**: `/tools`
**Acesso**: Autenticado + permissao CREATE_TABLE

**Header**: H1 "Ferramentas do Sistema"

**Conteudo**:
- Card "Clonar Modelos de Tabela":
  - CardTitle com icone WrenchIcon
  - CardDescription: "Crie uma nova tabela com base em uma tabela existente"
  - Combobox paginado para selecionar tabela modelo
  - Input para nome da nova tabela (placeholder "ex: Atividades")
  - Botao "Clonar Modelo" (disabled se nada selecionado, spinner no loading)

---

## TELAS DE ERRO (globais)

### Pagina 404 (Not Found)
- Card centralizado
- Icone SearchX grande
- Texto: "Pagina nao encontrada"
- Botao "Ir para inicio" -> /

### Erro de Carregamento
- Icone CloudAlert
- Texto: mensagem do erro ou "Erro ao carregar dados"
- Botao "Tentar novamente" com icone RefreshCcw

### Erro de Rota
- Card centralizado
- Icone AlertTriangle
- Texto: mensagem do erro
- Botao "Tentar Novamente"

### Acesso Negado
- Icone ShieldX grande
- Texto: "Acesso negado"
- Botao "Voltar"

### Loading Global
- Spinner centralizado (Loader2 com animacao spin)
- Texto: "Carregando..."

---

## ESTADOS IMPORTANTES

### Toast Notifications
- Posicao: canto inferior direito
- Tipos: sucesso (verde), erro (vermelho), info (azul)
- Auto-dismiss apos 5 segundos
- Suporte a titulo + descricao

### Empty States
- Quando listas/tabelas estao vazias
- Icone cinza grande + texto descritivo + acao sugerida

### Skeleton Loading
- Usado enquanto dados carregam
- Retangulos cinza com animacao shimmer
- Replica o layout final dos dados

### Upload Progress
- Barra de progresso por arquivo
- Lista de arquivos com nome, tamanho, status
- Botao remover por arquivo
- Dropzone com icone Upload e texto "Arraste arquivos ou clique para selecionar"

---

## RESPONSIVIDADE

### Mobile (< 640px)
- Sidebar: overlay Sheet deslizante da esquerda
- Filtros: Sheet deslizante
- Tabelas: scroll horizontal
- Grids: 1 coluna
- Header: compactado
- Pagination: simplificada (sem texto "Pagina X de Y")

### Tablet (640px - 1024px)
- Sidebar: colapsavel para icones (48px)
- Grids: 2 colunas
- Filtros: sidebar lateral animada

### Desktop (> 1024px)
- Sidebar: expandida 256px
- Grids: 3-4 colunas
- Filtros: sidebar lateral fixa
- Tabelas: todas as colunas visiveis

---

## ACESSIBILIDADE
- Todos os inputs com labels associados (htmlFor)
- aria-invalid em campos com erro
- aria-label em botoes de icone
- Focus ring visivel (3px azul)
- role="navigation" na paginacao
- sr-only para textos de acessibilidade
- Keyboard navigation: Tab, Enter, Escape
- Sidebar toggle: Ctrl+B
