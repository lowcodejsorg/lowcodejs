# Recurso: Locales

O recurso **Locales** fornece internacionalizacao (i18n) para a aplicacao. Os arquivos de traducao sao armazenados no diretorio `_locales/` no formato `.properties` e servidos via API.

---

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/locales/` | Sim | Lista locales disponiveis |
| GET | `/locales/:locale` | Opcional | Retorna traducoes de um locale |

---

## Arquitetura

```
resources/locales/
  list/    # GET /locales/
  show/    # GET /locales/:locale
```

Os dados de locale sao lidos diretamente do sistema de arquivos, sem persistencia em banco de dados.

---

## Listar Locales Disponiveis

**`GET /locales/`**

Lista os locales disponiveis no diretorio `_locales/`. O endpoint le os nomes dos arquivos e retorna os identificadores de locale.

### Autenticacao

Este endpoint requer autenticacao (`AuthenticationMiddleware` com `optional: false`).

### Resposta de Sucesso (200)

```json
[
  { "locale": "pt-br" },
  { "locale": "en-us" }
]
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 500 | LOCALES_READ_ERROR | Erro ao ler o diretorio de locales |

---

## Obter Traducoes de um Locale

**`GET /locales/:locale`**

Le o arquivo `.properties` correspondente ao locale e retorna as traducoes como pares chave-valor.

### Autenticacao

Este endpoint possui autenticacao opcional (`AuthenticationMiddleware` com `optional: true`), permitindo acesso sem login.

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `locale` | string | Identificador do locale (ex: `pt-br`, `en-us`) |

### Formato do Arquivo `.properties`

Os arquivos seguem o formato Java Properties:

```properties
# Comentarios sao ignorados
chave=valor
chave.composta=outro valor
lista=item1;item2;item3
```

Regras de parsing:

- Linhas vazias e linhas iniciando com `#` sao ignoradas
- Cada linha e dividida pelo primeiro `=` em chave e valor
- Se o valor contem `;`, e dividido em array de strings
- Valores sem `;` sao retornados como string simples

### Resposta de Sucesso (200)

```json
{
  "app.title": "LowCodeJS",
  "app.description": "Plataforma low-code",
  "menu.items": ["Inicio", "Tabelas", "Configuracoes"],
  "button.save": "Salvar",
  "button.cancel": "Cancelar"
}
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | LOCALE_NOT_FOUND | Arquivo de locale nao encontrado |
| 500 | LOCALE_READ_ERROR | Erro ao ler o arquivo de locale |

---

## Locales Disponiveis

Os seguintes locales estao disponiveis por padrao:

| Locale | Idioma |
|--------|--------|
| `pt-br` | Portugues (Brasil) |
| `en-us` | Ingles (Estados Unidos) |

Os arquivos ficam em:

```
backend/
  _locales/
    pt-br.properties
    en-us.properties
```

---

## Implementacao

### ListUseCase

Le o diretorio `_locales/` e retorna os nomes dos arquivos sem extensao:

```typescript
const pathname = join(process.cwd(), '_locales');
const files = await readdir(pathname);
const locales = files.map((file) => ({ locale: file.split('.')[0] }));
```

### ShowUseCase

Le o arquivo `.properties`, faz o parsing e retorna um objeto de traducoes:

```typescript
type Translations = Record<string, string | string[]>;

// Para cada linha do arquivo:
const [key, ...valueParts] = trimmed.split('=');
const value = valueParts.join('=').trim();

if (!value.includes(';')) {
  translations[key.trim()] = value;
} else {
  translations[key.trim()] = value.split(';').filter(Boolean).map((v) => v.trim());
}
```

> Valores que contem `=` apos o primeiro sao preservados corretamente (ex: `url=https://example.com?param=value` resulta em `{ "url": "https://example.com?param=value" }`).
