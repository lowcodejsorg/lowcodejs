# 🔐 Sistema de Permissões

## 📊 Grupos de Usuários

| Grupo             | Slug            | Descrição                                                     |
| ----------------- | --------------- | ------------------------------------------------------------- |
| **Master**        | `master`        | Gerencia todas as listas e também as configurações do sistema |
| **Administrador** | `administrator` | Gerencia todas as listas e usuários                           |
| **Gerente**       | `manager`       | Cria listas e gerencia suas próprias listas                   |
| **Registrado**    | `registered`    | Apenas acessa listas e insere linhas                          |

---

## 🔑 Permissões dos Grupos

### Master

| Permissão       | Descrição                                                  |
| --------------- | ---------------------------------------------------------- |
| `lists.create`  | Permite criar uma nova lista                               |
| `lists.delete`  | Permite remover ou deletar listas existentes               |
| `lists.update`  | Permite atualizar dados de uma lista existente             |
| `lists.read`    | Permite visualizar e acessar listas existentes             |
| `fields.create` | Permite criar um campo em uma lista existente              |
| `fields.update` | Permite atualizar dados de campos em uma lista existente   |
| `fields.delete` | Permite remover ou deletar campos de uma lista existente   |
| `fields.read`   | Permite visualizar e acessar campos de uma lista existente |
| `rows.create`   | Permite criar novas linhas em uma lista existente          |
| `rows.update`   | Permite atualizar dados de linhas em uma lista existente   |
| `rows.delete`   | Permite remover linhas de uma lista existente              |
| `rows.read`     | Permite visualizar e acessar linhas de uma lista existente |

---

### Administrador

| Permissão       | Descrição                                                  |
| --------------- | ---------------------------------------------------------- |
| `lists.create`  | Permite criar uma nova lista                               |
| `lists.delete`  | Permite remover ou deletar listas existentes               |
| `lists.update`  | Permite atualizar dados de uma lista existente             |
| `lists.read`    | Permite visualizar e acessar listas existentes             |
| `fields.create` | Permite criar um campo em uma lista existente              |
| `fields.update` | Permite atualizar dados de campos em uma lista existente   |
| `fields.delete` | Permite remover ou deletar campos de uma lista existente   |
| `fields.read`   | Permite visualizar e acessar campos de uma lista existente |
| `rows.create`   | Permite criar novas linhas em uma lista existente          |
| `rows.update`   | Permite atualizar dados de linhas em uma lista existente   |
| `rows.delete`   | Permite remover linhas de uma lista existente              |
| `rows.read`     | Permite visualizar e acessar linhas de uma lista existente |

---

### Gerente

| Permissão       | Descrição                                                  |
| --------------- | ---------------------------------------------------------- |
| `lists.create`  | Permite criar uma nova lista                               |
| `lists.update`  | Permite atualizar dados de uma lista existente             |
| `lists.read`    | Permite visualizar e acessar listas existentes             |
| `fields.create` | Permite criar um campo em uma lista existente              |
| `fields.update` | Permite atualizar dados de campos em uma lista existente   |
| `fields.delete` | Permite remover ou deletar campos de uma lista existente   |
| `fields.read`   | Permite visualizar e acessar campos de uma lista existente |
| `rows.create`   | Permite criar novas linhas em uma lista existente          |
| `rows.update`   | Permite atualizar dados de linhas em uma lista existente   |
| `rows.delete`   | Permite remover linhas de uma lista existente              |
| `rows.read`     | Permite visualizar e acessar linhas de uma lista existente |

---

### Registrado

| Permissão   | Descrição                                                  |
| ----------- | ---------------------------------------------------------- |
| `rows.read` | Permite visualizar e acessar linhas de uma lista existente |

---

## 📋 Tipos de Listas e Permissões

### 🔒 Restrita

| Ação               | Permissão     | Quem pode executar       |
| ------------------ | ------------- | ------------------------ |
| Ver a lista        | `lists.read`  | Apenas dono e convidados |
| Adicionar registro | `rows.create` | Apenas dono e convidados |
| Editar registros   | `rows.update` | Apenas dono e convidados |
| Apagar registros   | `rows.delete` | Apenas dono e convidados |
| Gerenciar campos   | `fields.*`    | Apenas dono e convidados |

---

### 🔓 Aberta

| Ação               | Permissão     | Quem pode executar       |
| ------------------ | ------------- | ------------------------ |
| Ver a lista        | `lists.read`  | Usuário logado           |
| Adicionar registro | `rows.create` | Usuário logado           |
| Editar registros   | `rows.update` | Apenas dono e convidados |
| Apagar registros   | `rows.delete` | Apenas dono e convidados |
| Gerenciar campos   | `fields.*`    | Apenas dono e convidados |

---

### 🌐 Pública

| Ação               | Permissão     | Quem pode executar             |
| ------------------ | ------------- | ------------------------------ |
| Ver a lista        | `lists.read`  | Usuário não logado (visitante) |
| Adicionar registro | `rows.create` | Usuário logado                 |
| Editar registros   | `rows.update` | Apenas dono e convidados       |
| Apagar registros   | `rows.delete` | Apenas dono e convidados       |
| Gerenciar campos   | `fields.*`    | Apenas dono e convidados       |

---

### 📝 Formulário Online

| Ação               | Permissão     | Quem pode executar             |
| ------------------ | ------------- | ------------------------------ |
| Ver a lista        | `lists.read`  | Apenas dono e convidados       |
| Adicionar registro | `rows.create` | Usuário não logado (visitante) |
| Editar registros   | `rows.update` | Apenas dono e convidados       |
| Apagar registros   | `rows.delete` | Apenas dono e convidados       |
| Gerenciar campos   | `fields.*`    | Apenas dono e convidados       |

---

## 🎯 Matriz Completa: Grupos x Tipos de Lista

### Ver a Lista (`lists.read`)

| Tipo de Lista  | Visitante | Registrado   | Gerente      | Administrador | Master |
| -------------- | --------- | ------------ | ------------ | ------------- | ------ |
| **Restrita**   | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Aberta**     | ❌        | ✅           | ✅           | ✅            | ✅     |
| **Pública**    | ✅        | ✅           | ✅           | ✅            | ✅     |
| **Formulário** | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |

---

### Adicionar Registro (`rows.create`)

| Tipo de Lista  | Visitante | Registrado   | Gerente      | Administrador | Master |
| -------------- | --------- | ------------ | ------------ | ------------- | ------ |
| **Restrita**   | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Aberta**     | ❌        | ✅           | ✅           | ✅            | ✅     |
| **Pública**    | ❌        | ✅           | ✅           | ✅            | ✅     |
| **Formulário** | ✅        | ✅           | ✅           | ✅            | ✅     |

---

### Editar/Apagar Registros (`rows.update` / `rows.delete`)

| Tipo de Lista  | Visitante | Registrado   | Gerente      | Administrador | Master |
| -------------- | --------- | ------------ | ------------ | ------------- | ------ |
| **Restrita**   | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Aberta**     | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Pública**    | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Formulário** | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |

---

### Gerenciar Campos (`fields.*`)

| Tipo de Lista  | Visitante | Registrado   | Gerente      | Administrador | Master |
| -------------- | --------- | ------------ | ------------ | ------------- | ------ |
| **Restrita**   | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Aberta**     | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Pública**    | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |
| **Formulário** | ❌        | 🔑 Convidado | 🔑 Convidado | ✅            | ✅     |

---

## 📝 Legenda

| Símbolo      | Significado                                        |
| ------------ | -------------------------------------------------- |
| ✅           | Sempre permitido                                   |
| ❌           | Sempre negado                                      |
| 🔑 Convidado | Permitido apenas se for dono ou convidado da lista |

---

## 🔍 Observações Importantes

### Hierarquia de Grupos

```
Master (Nível 4)
↓
Administrador (Nível 3)
↓
Gerente (Nível 2)
↓
Registrado (Nível 1)
↓
Visitante (Nível 0)
```

### Regras Especiais

1. **Dono da Lista**: Sempre tem controle total sobre sua própria lista, independente do grupo
2. **Master e Administrador**: Têm acesso total a todas as listas do sistema
3. **Gerente**: Só gerencia suas próprias listas (ou onde foi convidado)
4. **Convidados**: Podem ter diferentes níveis de acesso dentro de uma lista específica

### Diferença entre Master e Administrador

| Capacidade                   | Master | Administrador |
| ---------------------------- | ------ | ------------- |
| Gerenciar todas as listas    | ✅     | ✅            |
| Gerenciar usuários           | ✅     | ✅            |
| Configurações do sistema     | ✅     | ❌            |
| Gerenciar grupos de usuários | ✅     | ❌            |

### Diferença entre Gerente e Registrado

| Capacidade                    | Gerente | Registrado |
| ----------------------------- | ------- | ---------- |
| Criar listas                  | ✅      | ❌         |
| Gerenciar próprias listas     | ✅      | ❌         |
| Convidar usuários             | ✅      | ❌         |
| Acessar listas compartilhadas | ✅      | ✅         |

---

## 🎨 Resumo Visual por Tipo de Lista

### 🔒 Restrita

- **Uso**: Projetos confidenciais, dados sensíveis
- **Acesso**: Mínimo (só convidados)
- **Exemplo**: Planejamento estratégico, informações financeiras

### 🔓 Aberta

- **Uso**: Colaboração interna
- **Acesso**: Qualquer usuário logado pode contribuir
- **Exemplo**: Wiki da empresa, base de conhecimento

### 🌐 Pública

- **Uso**: Conteúdo visível externamente
- **Acesso**: Visitantes podem ver, logados podem contribuir
- **Exemplo**: Catálogo de produtos, blog corporativo

### 📝 Formulário Online

- **Uso**: Coleta de dados externos
- **Acesso**: Qualquer um pode submeter, só dono vê respostas
- **Exemplo**: Formulário de contato, pesquisas, inscrições
