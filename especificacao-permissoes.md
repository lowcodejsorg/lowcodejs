# Especificação Permissões
**2026**

---

# Parte 1: Especificação (PDF + prints)

## Modelo de Permissões

**Objetivo**

- É uma revisão geral no esquema de permissões do framework
- Propõe um esquema de permissões baseado no RBAC
- Engloba a tabela, campos, o menu e opções em sistema

---

## Editar Grupo

### Adicionar/Editar Grupos de usuários

| Grupo / Acesso ao menu e ações | Engloba | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuarios | Configurações | Ferramentas | Plugins |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Master** | Administrator, Manager, Registered | sim | sim | sim | sim (e definitivamente) | sim | sim | sim | sim | sim | sim |
| **Administrator** | Manager, Registered | sim | sim | sim | sim | sim | sim | nao | nao | nao | nao |
| **Manager** | Registered | sim | sim | apenas a sua | apenas a sua | nao | nao | nao | nao | nao | nao |
| **Registered** | Nenhum | sim | nao | nao | nao | nao | nao | nao | nao | nao | nao |

Os papéis atribuídos a cada grupo de usuários controlam o acesso às principais áreas do sistema e suas ações.

**Nota:** O grupo Super Admin ou Master tem todas os papeis e não é possível remover elas (não pode editar)

A opção **Engloba** permite que um grupo englobe usuários de outros grupos. Isso significa que se uma opção do menu estiver como Registered e o usuário for Manager, como Manager engloba Registered, o usuário do grupo Manager vai conseguir acessar.

```
Tabela X   > Para acessar tem que pertencer ao Grupo Y
Usuario A  > Retorna que ele pertence ao Grupo Z que Engloba Y, retorna grupos pertencentes: Z, Y
Resultado  > Usuário pode acessar a Tabela X
```

Esses relacionamentos simulam o nível de acesso e abrem espaço para cenários mais complexos. O caso mais comum é criar grupos com Registered e Manager vinculados.

---

## Editar Tabela

### Permissões da tabela

Ao **Editar as configurações da tabela**, os grupos são vinculados as ações da tabela. **Public** é uma permissão para usuários não logados e **Nobody** é uma restrição no qual nenhum grupo pode realizar aquela ação.

Dessa maneira, um grupo pode apenas inserir itens enquanto outro pode gerenciar todos os registros e os campos.

**Exemplo:** Pode ser criar um grupo Vendas que tem as mesmas permissões de Registrado, mas que pode atualizar a tabela de contatos realizados e não pode acessar uma tabela do Financeiro.

Pode ter um grupo de Vendas-Consultores que apenas criar novos registros e outro Vendas-Admin que gerencia todos os registros.

Pode ter uma tabela como Filiais com o View table Publico, no qual um usuário pode consultar o telefone e endereço de uma Filial, mas não pode realizar nenhuma outra ação.

Pode ter uma tabela Pesquisa Satisfação na qual é publico Adicionar um registro (preencher e enviar o formulário), mas não pode acessar a tabela.

**Estrutura de permissões (cada ação aceita Grupo ou Public ou Nobody):**

| View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|
| Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody | Grupo ou Public ou Nobody |

### Permissões da tabela: tela atual (a remover)

Tela "Detalhes da tabela" com: Nome (Clientes), Descrição, Layout de visualização (Lista), e os campos **Visibilidade** (Restrita), **Colaboração** (Restrita) e **Administradores** marcados com X vermelho, indicando que esse modelo atual deve ser removido e substituído pelo novo esquema.

### Permissões da tabela: tela proposta

Exemplo de configuração na tela "Detalhes da tabela":

| View table | Update table | Create field | Update field | Remove field |
|---|---|---|---|---|
| Public | Master | Master | Master | Master |

| View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|
| Registered | Registered | Manager | Manager | Public |

**Dono:** Oliveria

**Anotações na tela:**
- No dropdown, alem dos grupos deve aparecer as opções Public e Nobody
- Deve ser possível trocar o dono do grupo

---

## Editar Grupos de Usuário

### Grupos de usuários

Tela "Detalhes do grupo" (com botão Editar):

- **Slug (identificador):** Dono
- **Nome:** Master
- **Descrição:** Acesso total ao sistema - gerencia tudo, incluindo configurações do sistema
- **Permissões:** Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuários | Configurações | Ferramentas | Plugins
- **Grupos vinculados:** Registered

**Anotações na tela:**
- Permissões: "Como esta hoje usando tags, mas as permissões devem ser diferentes"
- Grupos vinculados: "Componente para escolha tipo relacionamento múltiplo"

---

## Editar Opção do Menu

### Permissões do menu

| Permissões do menu | Grupos |
|---|---|
| Visibilidade | Grupo ou Public ou Nobody |

Tela "Detalhes do menu":

- **Nome:** Clientes
- **Tipo:** Tabela
- **Menu Pai:** Nenhum (raiz)
- **Tabela:** Clientes
- **Grupo:** Registered

**Anotação na tela:** Grupo que pode ver a opção do menu

---

## Editar Opção do Campo

### Permissões no campo

| Permissões no campo | Valor |
|---|---|
| Lista | Grupo |
| Formulário | Grupo |
| Detalhes | Grupo |

Tela "Detalhes do campo":

- **Nome:** CPF
- **Tipo:** Texto
- **Formato:** Inteiro
- **Valor padrão:** (deixe em branco se não houver)
- **Obrigatoriedade:** Este campo é obrigatório? (Não/Sim)
- **Enviar para lixeira:** Enviar este campo para a lixeira? (Não/Sim)

Exemplo de configuração:

| Lista | Formulário | Detalhes |
|---|---|---|
| Registrado | Gerente | Administrador |

**Anotação na tela:** Grupo que pode fazer essa ação no campo. Impacto no formulário

---

## Editar Usuário

- Um usuário pode pertencer a vários grupos

---

# Parte 2: Planilha "Grupos de usuários e permissões da tabela (Final)"

---

## Aba: Página1

### Tabela: Permissão/Ação

| Tabela | Ver a lista | Adicionar registro | Editar/apagar registros | Gerenciar campos |
|---|---|---|---|---|
| Privada | Apenas dono e convidados | Apenas dono e convidados | Apenas dono e convidados | Apenas dono e convidados |
| Restrita | Usuário logado | Apenas dono e convidados | Apenas dono e convidados | Apenas dono e convidados |
| Aberta | Usuário logado | Usuário logado | Apenas dono e convidados | Apenas dono e convidados |
| Pública | Usuário nao logado (visitante) | Usuário logado | Apenas dono e convidados | Apenas dono e convidados |
| Formuário | Apenas dono e convidados | Usuário nao logado (visitante) | Apenas dono e convidados | Apenas dono e convidados |

### Grupo / Permissão

| Grupo / Permissão | Pode criar tabela | Pode atualizar tabela | Pode remover tabela | Pode visualizar tabela | Pode gerenciar campos | Pode criar registros | Pode editar registros | Pode remover registros | Pode visualizar registros |
|---|---|---|---|---|---|---|---|---|---|
| Super Admin | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Administrator | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Manager | apenas tabelas próprias | somente tabelas próprias ou onde é admin | somente tabelas próprias ou onde é admin | Sim | somente tabelas próprias ou onde é admin | Sim | somente tabelas próprias ou onde é admin | somente tabelas próprias ou onde é admin | Sim |
| Registered | apenas onde é admin | apenas onde é admin | apenas onde é admin | Sim | apenas onde é admin | Sim | apenas onde é admin | apenas onde é admin | Sim |

### Dicionário de permissões

| Permissão | Descrição |
|---|---|
| Create table | Permite criar uma nova tabela |
| Update table | Permite atualizar dados de uma tabela existente |
| Remove table | Permite remover ou excluir tabelas existentes |
| View table | Permite visualizar tabelas existentes |
| Create field | Permite criar um campo em uma tabela existente |
| Update field | Permite atualizar dados de um campo existente |
| Remove field | Permite remover ou excluir campos de uma tabela existente |
| View field | Permite visualizar campos de uma tabela existente |
| Create row | Permite criar novas linhas em uma tabela existente |
| Update row | Permite atualizar dados de uma linha existente |
| Remove row | Permite remover linhas de uma tabela existente |
| View row | Permite visualizar linhas de uma tabela existente |

---

## Aba: Página2

### Grupo / Acesso ao menu e ações

| Grupo / Acesso ao menu e ações | Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuarios | Configurações | Ferramentas | Plugins |
|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin | sim | sim | sim | sim (pode excluir para sempre) | sim | sim | sim | sim | sim | sim |
| Administrator | sim | sim | sim | sim | sim | sim | nao | nao | nao | nao |
| Manager | sim | sim | apenas a sua | apenas a sua | nao | nao | nao | nao | nao | nao |
| Registered | sim | nao | nao | nao | nao | nao | nao | nao | nao | nao |

### Tipos de usuarios da tabela (convidados)

| Tipos de usuarios da tabela (convidados) | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|---|
| owner | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| admin | sim | nao | sim | sim | sim | sim | sim | sim | sim | sim |
| editor | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |
| contributor | sim | nao | nao | nao | nao | nao | sim | apenas a sua | apenas a sua | sim |
| viewer | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |

### Colaboração

| Colaboração | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|---|
| Privada | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados |
| Restrita | Todos os grupos | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | Todos os grupos |
| Aberta | Todos os grupos | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | Todos os grupos | dono e convidados | dono e convidados | Todos os grupos |
| Pública | Visitante | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | Todos os grupos | dono e convidados | dono e convidados | Visitante |
| Pesquisa | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | dono e convidados | Visitante | dono e convidados | dono e convidados | dono e convidados |

---

## Aba: Opcao3

### Grupo / Acesso ao menu e ações

| Grupo / Acesso ao menu e ações | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuarios | Configurações | Ferramentas | Plugins |
|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin | sim | sim | sim | sim (pode excluir para sempre) | sim | sim | sim | sim | sim | sim |
| Administrator | sim | sim | sim | sim | sim | sim | nao | nao | nao | nao |
| Manager | sim | sim | apenas a sua | apenas a sua | nao | nao | nao | nao | nao | nao |
| Registered | sim | nao | nao | nao | nao | nao | nao | nao | nao | nao |

**Nota:** com excecao das tabelas, sim significa poder realizar todas as acoes disponiveis na tela (adicionar, ver, editar e apagar)

### Perfis de usúarios da tabela (convidados)

| Perfis de usúarios da tabela (convidados) | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|---|
| owner | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| admin | sim | nao | sim | sim | sim | sim | sim | sim | sim | sim |
| editor | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |
| contributor | sim | nao | nao | nao | nao | nao | sim | apenas a sua | apenas a sua | sim |
| viewer | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |

**Nota:** o ideal é permitir gerenciar isso dinamicamente

### Permissões da tabela

| Ação | Opção 1 | Opção 2 | Opção 3 |
|---|---|---|---|
| View table e view row | Dono e convidados | Usuário logado | Visitante |
| Create Row | Dono e convidados | Usuário logado | Visitante |
| Outras ações da tabela | Dono e convidados | Dono e convidados | Dono e convidados |

### Prototipações

- fazer a prototipacao de gestao para admin
- fazer a prototipacao da edicao da tabela
- fazer a prototipacao das permissoes do menu
  - caso de uso: grupo de usuarios precisam acessar uma opcao e as tabelas abaixo
  - se for apenas um separador deve ser similar a gestao dos perfis da tabela, na qual os usuarios sao convidados e tem a parte da colaboracao
  - a opcao de menu que é uma lista, deve usar as permissoes da lista para mostrar ou nao a opção

### Permissões do menu

| Permissão | Opção 1 | Opção 2 | Opção 3 |
|---|---|---|---|
| Visibilidade | Dono e convidados | Usuário logado | Visitante |
| Convidados | Lista de usuarios | | |

### Permissoes no campo

| Permissão | Valor |
|---|---|
| visibilidade adicionar | oculto ou escolher o perfil de usuario da lista |
| visibilidade editar | oculto ou escolher o perfil de usuario da lista |
| visibilidade detalhes | oculto ou escolher o perfil de usuario da lista |

**Duvidas:** escolher viewer deve englobar todas os outros perfis de usuario. Escolher registrado na colaboracao, deveria equivaler ao usuario logado e englobar todos os outros grupos de usuario. Fazer grupos hierarquicos?

---

## Aba: 060226

### Grupo / Acesso ao menu e ações

| Grupo / Acesso ao menu e ações | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuarios | Configurações | Ferramentas | Plugins | Engloba | Herança |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin | sim | sim | sim | sim (pode excluir para sempre) | sim | sim | sim | sim | sim | sim | | Administrator, Manager, Registered |
| Administrator | sim | sim | sim | sim | sim | sim | nao | nao | nao | nao | Super Admin | |
| Manager | sim | sim | apenas a sua | apenas a sua | nao | nao | nao | nao | nao | nao | Super Admin, Administrator | |
| Registered | sim | nao | nao | nao | nao | nao | nao | nao | nao | nao | Super Admin, Administrator, Manager | |

**Nota:** com excecao das tabelas, sim significa poder realizar todas as acoes disponiveis na tela (adicionar, ver, editar e apagar)

### Perfis de usúarios da tabela (convidados)

| Perfis de usúarios da tabela (convidados) | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|---|
| owner | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| admin | sim | nao | sim | sim | sim | sim | sim | sim | sim | sim |
| editor | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |
| contributor | sim | nao | nao | nao | nao | nao | sim | apenas a sua | apenas a sua | sim |
| viewer | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |

**Nota:** o ideal é permitir gerenciar isso dinamicamente

### Permissões da tabela

| Ação | Opção 1 | Opção 2 | Opção 3 |
|---|---|---|---|
| View table e view row | Dono e convidados | Usuário logado | Visitante |
| Create Row | Dono e convidados | Usuário logado | Visitante |
| Outras ações da tabela | Dono e convidados | Dono e convidados | Dono e convidados |

### Prototipações

- fazer a prototipacao de gestao para admin
- fazer a prototipacao da edicao da tabela
- fazer a prototipacao das permissoes do menu
  - caso de uso: grupo de usuarios precisam acessar uma opcao e as tabelas abaixo
  - se for apenas um separador deve ser similar a gestao dos perfis da tabela, na qual os usuarios sao convidados e tem a parte da colaboracao
  - a opcao de menu que é uma lista, deve usar as permissoes da lista para mostrar ou nao a opção

### Permissões do menu

| Permissões do menu | Grupos |
|---|---|
| Visibilidade | Registrado |

### Permissoes no campo

| Permissão | Valor |
|---|---|
| visibilidade adicionar | oculto ou escolher o perfil de usuario da lista |
| visibilidade editar | oculto ou escolher o perfil de usuario da lista |
| visibilidade detalhes | oculto ou escolher o perfil de usuario da lista |

**Duvidas:** escolher viewer deve englobar todas os outros perfis de usuario. Escolher registrado na colaboracao, deveria equivaler ao usuario logado e englobar todos os outros grupos de usuario. Fazer grupos hierarquicos?

---

## Aba: 060226-Oficial

### Grupo / Acesso ao menu e ações

| Grupo / Acesso ao menu e ações | Grupo Pai | Herda | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas | Usuários | Menu | Grupos de usuarios | Configurações | Ferramentas | Plugins |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Super Admin | Administrator | Administrator, Manager, Registered | sim | sim | sim | sim (pode excluir para sempre) | sim | sim | sim | sim | sim | sim |
| Administrator | Manager | Manager, Registered | sim | sim | sim | sim | sim | sim | nao | nao | nao | nao |
| Manager | Registered | Registered | sim | sim | apenas a sua | apenas a sua | nao | nao | nao | nao | nao | nao |
| Registered | Nenhum | Nenhuma | sim | nao | nao | nao | nao | nao | nao | nao | nao | nao |

**Nota:** com excecao das tabelas, sim significa poder realizar todas as acoes disponiveis na tela (adicionar, ver, editar e apagar)

### Perfis de usúarios da tabela (convidados)

| Perfis de usúarios da tabela (convidados) | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row | Remove row | View row |
|---|---|---|---|---|---|---|---|---|---|---|
| owner | sim | sim | sim | sim | sim | sim | sim | sim | sim | sim |
| admin | sim | nao | sim | sim | sim | sim | sim | sim | sim | sim |
| editor | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |
| contributor | sim | nao | nao | nao | nao | nao | sim | apenas a sua | apenas a sua | sim |
| viewer | sim | nao | nao | nao | nao | nao | sim | sim | sim | sim |

**Nota:** o ideal é permitir gerenciar isso dinamicamente. Permissões validas apeanas para Registrado e Manager

### Permissões da tabela (colaboração)

| Ação | Opção 1 | Opção 2 | Opção 3 |
|---|---|---|---|
| View table e view row | Dono e convidados | Registered | Visitante |
| Create Row | Dono e convidados | Registered | Visitante |
| Outras ações da tabela | Dono e convidados | Dono e convidados | Dono e convidados |

### Prototipações

- fazer a prototipacao de gestao para admin
- fazer a prototipacao da edicao da tabela
- fazer a prototipacao das permissoes do menu
  - caso de uso: grupo de usuarios precisam acessar uma opcao e as tabelas abaixo
  - se for apenas um separador deve ser similar a gestao dos perfis da tabela, na qual os usuarios sao convidados e tem a parte da colaboracao
  - a opcao de menu que é uma lista, deve usar as permissoes da lista para mostrar ou nao a opção

### Permissões do menu

| Permissões do menu | Grupo |
|---|---|
| Visibilidade | Escolhe grupo |

### Permissoes no campo

| Permissão | Valor |
|---|---|
| visibilidade adicionar | oculto ou escolher o perfil de usuario da lista |
| visibilidade editar | oculto ou escolher o perfil de usuario da lista |
| visibilidade detalhes | oculto ou escolher o perfil de usuario da lista |

**Duvidas:** escolher viewer deve englobar todas os outros perfis de usuario. Escolher registrado na colaboracao, deveria equivaler ao usuario logado e englobar todos os outros grupos de usuario. Fazer grupos hierarquicos?
