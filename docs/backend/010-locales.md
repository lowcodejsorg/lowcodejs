# Internacionalizacao (`_locales/`)

O diretorio `_locales/` contem os arquivos de traducao utilizados para internacionalizacao (i18n) do frontend. Os textos sao servidos pelo backend atraves de endpoints REST dedicados.

## Estrutura

```
_locales/
  pt-br.properties    # Portugues (Brasil)
  en-us.properties     # Ingles (Estados Unidos)
```

## Formato dos Arquivos

Os arquivos utilizam o formato **Java `.properties`**, com pares chave-valor separados por `=`:

```properties
GLOBAL_SAVE=Salvar
GLOBAL_CANCEL=Cancelar
GLOBAL_DELETE=Excluir
AUTH_SIGNIN_TITLE=Entrar
AUTH_SIGNUP_TITLE=Criar conta
```

## Endpoints

O backend disponibiliza os seguintes endpoints para acesso aos locales:

| Endpoint                    | Descricao                                   |
|-----------------------------|---------------------------------------------|
| `GET /locales`              | Lista os locales disponiveis                |
| `GET /locales/:locale`      | Retorna o conteudo de um locale especifico  |

## Categorias de Traducao

As chaves sao organizadas por categorias, utilizando um prefixo que identifica a area do sistema:

| Prefixo              | Area                                         |
|----------------------|----------------------------------------------|
| `GLOBAL`             | Textos genericos (botoes, acoes, mensagens)  |
| `SIDEBAR`            | Menu lateral                                 |
| `HEADER`             | Cabecalho da aplicacao                       |
| `AUTH_SIGNIN`        | Tela de login                                |
| `AUTH_SIGNUP`        | Tela de cadastro                             |
| `PASSWORD_RECOVERY`  | Recuperacao de senha                         |
| `DASHBOARD`          | Painel principal                             |
| `USER`               | Gerenciamento de usuarios                    |
| `USER_GROUP`         | Grupos de usuarios                           |
| `TABLE`              | Tabelas dinamicas                            |
| `SETTINGS`           | Configuracoes do sistema                     |
| `PROFILE`            | Perfil do usuario                            |
| `FIELD`              | Campos das tabelas                           |

## Locale Padrao

O locale padrao do sistema e **pt-br**, configuravel atraves da variavel de ambiente `Env.LOCALE`. Caso o cliente nao especifique um locale, o sistema utiliza o valor configurado nessa variavel.

## Adicionando um Novo Locale

Para adicionar suporte a um novo idioma:

1. Crie um novo arquivo no diretorio `_locales/` seguindo o padrao de nomenclatura `<idioma>-<pais>.properties` (ex: `es-es.properties`).
2. Copie todas as chaves de um locale existente (ex: `pt-br.properties`) e traduza os valores.
3. O novo locale sera automaticamente reconhecido e listado pelo endpoint `GET /locales`.
