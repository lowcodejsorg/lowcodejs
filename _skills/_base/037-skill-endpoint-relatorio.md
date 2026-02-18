# Skill: Report Endpoint (Backend)

O endpoint de relatorio e o padrao backend para agregacao de dados. Cada endpoint e um `GET /reports/[entity]` que aceita filtros via query params, executa multiplas queries em paralelo com `Promise.all` (count, groupBy), transforma os resultados e retorna a shape padrao `{ summary, filters, generated_at }`. Existem 7 endpoints de relatorio no codebase, todos seguindo a mesma arquitetura: Controller com validacao Zod, Use Case com Either, e agregacao via repository + Prisma `groupBy`.

---

## Estrutura do Arquivo

```
backend/
  application/
    resources/
      reports/
        [entity]-report/
          [entity]-report.controller.ts          <-- GET /reports/[entity]
          [entity]-report.use-case.ts            <-- Agregacao com Promise.all
          [entity]-report.schema.ts              <-- Zod schema para query params
          [entity]-report.doc.ts                 <-- Swagger documentation schema
```

- Cada relatorio vive em `resources/reports/[entity]-report/`.
- Todos os controllers estao registrados na rota `/reports`.

---

## Template: Controller

```typescript
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ERole } from '@application/core/entities';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { PermissionMiddleware } from '@application/middlewares/permissions.middleware';
import {{Entity}}ReportUseCase from './{{entity}}-report.use-case';
import { {{Entity}}ReportQuerySchema } from './{{entity}}-report.schema';
import { {{Entity}}ReportDocumentationSchema } from './{{entity}}-report.doc';

@Controller({ route: 'reports' })
export default class {{Entity}}ReportController {
  constructor(
    private readonly useCase: {{Entity}}ReportUseCase = getInstanceByToken({{Entity}}ReportUseCase),
  ) {}

  @GET({
    url: '/{{entities}}',
    options: {
      schema: {{Entity}}ReportDocumentationSchema,
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        PermissionMiddleware({ allowedRoles: [ERole.{{ROLE_1}}, ERole.{{ROLE_2}}] }),
      ],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = {{Entity}}ReportQuerySchema.parse(request.query);

    const result = await this.useCase.execute({
      ...query,
      user_id: request?.user.sub,
      role: request?.user.role,
    });

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
```

## Template: Schema de Query

```typescript
import z from 'zod';

export const {{Entity}}ReportQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  // Filtros especificos da entidade
  category_id: z.string().optional(),
  group_by: z.enum(['day', 'week', 'month']).optional().default('month'),
});

export type {{Entity}}ReportQuery = z.infer<typeof {{Entity}}ReportQuerySchema>;
```

## Template: Use Case

```typescript
import { Service } from 'fastify-decorators';
import type { Either } from '@application/core/either';
import { left, right } from '@application/core/either';
import HTTPException from '@application/core/exception';
import { {{Entity}}ContractRepository } from '@application/repositories/{{entity}}/{{entity}}-contract.repository';
import { prisma } from '@config/database';

interface {{Entity}}ReportData {
  summary: {
    total: number;
    // metricas especificas
  };
  by_category: Array<{ name: string; count: number; percentage: number }>;
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
  generated_at: string;
}

type Response = Either<HTTPException, {{Entity}}ReportData>;

@Service()
export default class {{Entity}}ReportUseCase {
  constructor(
    private readonly {{entity}}Repository: {{Entity}}ContractRepository,
  ) {}

  async execute(filters: Filters): Promise<Response> {
    try {
      // 1. Promise.all para queries paralelas
      const [
        total,
        byCategory,
        categories,
      ] = await Promise.all([
        this.{{entity}}Repository.count(payload),
        prisma.{{entity}}.groupBy({
          by: ['category_id'],
          where: this.buildWhere(payload),
          _count: { category_id: true },
        }),
        this.categoryRepository.findMany(),
      ]);

      // 2. Transform groupBy com lookup
      const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

      const byCategoryResult = byCategory.map((item) => ({
        name: categoryMap.get(item.category_id) || 'Desconhecido',
        count: item._count.category_id,
        percentage: total > 0 ? Math.round((item._count.category_id / total) * 100) : 0,
      }));

      byCategoryResult.sort((a, b) => b.count - a.count);

      // 3. Montar resposta padrao
      const reportData: {{Entity}}ReportData = {
        summary: { total },
        by_category: byCategoryResult,
        filters: {
          start_date: filters.start_date?.toISOString() ?? null,
          end_date: filters.end_date?.toISOString() ?? null,
        },
        generated_at: new Date().toISOString(),
      };

      return right(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      return left(HTTPException.InternalServerError('Internal server error', '{{ENTITY}}_REPORT_ERROR'));
    }
  }

  private buildWhere(filters: Filters) {
    const where: any = {};
    if (filters.start_date) where.created_at = { gte: filters.start_date };
    if (filters.end_date) where.created_at = { ...where.created_at, lte: filters.end_date };
    if (filters.category_id) where.category_id = filters.category_id;
    return where;
  }
}
```

---

## Exemplo Real

```typescript
// resources/reports/artisans-report/artisans-report.use-case.ts (trecho)
async execute(filters: Filters): Promise<Response> {
  try {
    const [
      totalArtisans,
      approvedArtisans,
      pendingArtisans,
      activeArtisans,
      updateRequestsByStatus,
      artisansByVillage,
      artisansByEthnicity,
      villages,
    ] = await Promise.all([
      this.artisanRepository.count(artisanPayload),
      this.artisanRepository.count({ ...artisanPayload, approved: true }),
      this.artisanRepository.count({ ...artisanPayload, approved: false }),
      prisma.artisan.count({
        where: { ...this.buildArtisanWhere(artisanPayload), user: { active: true } },
      }),
      this.updateRequestRepository.groupBy('status', updateRequestPayload),
      prisma.artisan.groupBy({
        by: ['village_id'],
        where: this.buildArtisanWhere(artisanPayload),
        _count: { village_id: true },
      }),
      prisma.artisan.groupBy({
        by: ['ethnicity'],
        where: this.buildArtisanWhere(artisanPayload),
        _count: { ethnicity: true },
      }),
      this.villageRepository.findMany(),
    ]);

    const villageMap = new Map(villages.map((v) => [v.id, v.name]));

    const byVillage = artisansByVillage.map((item) => ({
      name: villageMap.get(item.village_id) || 'Desconhecido',
      count: item._count.village_id,
      percentage: totalArtisans > 0
        ? Math.round((item._count.village_id / totalArtisans) * 100)
        : 0,
    }));

    byVillage.sort((a, b) => b.count - a.count);

    return right({
      summary: {
        total_artisans: totalArtisans,
        approved_artisans: approvedArtisans,
        pending_artisans: pendingArtisans,
        active_artisans: activeArtisans,
      },
      update_requests: {
        total: updateRequestsByStatus.reduce((sum, s) => sum + s.count, 0),
        by_status: {
          PENDING: updateRequestsByStatus.find((s) => s.value === 'PENDING')?.count ?? 0,
          APPROVED: updateRequestsByStatus.find((s) => s.value === 'APPROVED')?.count ?? 0,
          REJECTED: updateRequestsByStatus.find((s) => s.value === 'REJECTED')?.count ?? 0,
        },
      },
      by_village: byVillage,
      by_ethnicity: byEthnicity,
      filters: {
        start_date: filters.start_date?.toISOString() ?? null,
        end_date: filters.end_date?.toISOString() ?? null,
        village_id: filters.village_id ?? null,
        ethnicity: filters.ethnicity ?? null,
        approved: filters.approved ?? null,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating artisans report:', error);
    return left(HTTPException.InternalServerError('Internal server error', 'ARTISANS_REPORT_ERROR'));
  }
}
```

**Leitura do exemplo:**

1. `Promise.all` executa 8 queries em paralelo: counts com diferentes filtros, groupBy por coluna, e lookup de entidades relacionadas.
2. `groupBy` do Prisma retorna `[{ column_value, _count: { column: N } }]`. A transformacao converte para `{ name, count, percentage }`.
3. `Map` e usada para lookup eficiente de nomes (village name por village_id).
4. A porcentagem e calculada com `Math.round((count / total) * 100)` com guard contra divisao por zero.
5. Resultados sao ordenados por count decrescente: `sort((a, b) => b.count - a.count)`.
6. `filters` na resposta ecoa os filtros aplicados para o frontend renderizar no PDF.
7. `generated_at` e o timestamp ISO de geracao do relatorio.

---

## Response Shape Padrao

```typescript
interface ReportResponse {
  summary: {
    total: number;
    [key: string]: number;           // Metricas especificas
  };
  by_[dimension]: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  filters: {
    start_date: string | null;
    end_date: string | null;
    [key: string]: string | boolean | null;
  };
  generated_at: string;              // ISO timestamp
}
```

---

## Role-Based Filtering

```typescript
// Curators so veem seus proprios dados
const curator_id = role === ERole.CURATOR ? user_id : undefined;

const queryPayload = {
  ...filters,
  curator_id,  // undefined para ADMINISTRATOR, user_id para CURATOR
};
```

---

## Regras e Convencoes

1. **Response shape padrao** -- todo endpoint retorna `{ summary, filters, generated_at }` mais dimensoes especificas (`by_village`, `by_category`, etc.).

2. **`Promise.all` para queries paralelas** -- nunca execute queries de agregacao sequencialmente. Agrupe todas em `Promise.all` para performance.

3. **`groupBy` + Map para lookup** -- use Prisma `groupBy` para agregacao e `Map` para resolver nomes de entidades relacionadas.

4. **Porcentagem com guard** -- sempre verifique `total > 0` antes de calcular porcentagem para evitar `NaN`.

5. **Sort por count decrescente** -- dimensoes agregadas devem ser ordenadas por `count` decrescente.

6. **Filtros ecoados na resposta** -- o campo `filters` retorna os filtros aplicados (mesmo formato recebido) para o frontend exibir no PDF.

7. **Datas como string YYYY-MM-DD** -- query params recebem datas como string `YYYY-MM-DD`. O schema Zod faz `transform` para `Date`. A resposta retorna como ISO string.

8. **Role-based filtering** -- endpoints acessiveis por CURATOR devem filtrar automaticamente por `user_id` quando role e CURATOR. Administradores veem tudo.

9. **Either para erros** -- use cases retornam `Either<HTTPException, ReportData>`. O controller trata `isLeft()` retornando o erro HTTP.

10. **Error cause code** -- o `left()` deve usar cause code semantico: `ARTISANS_REPORT_ERROR`, `PIECES_REPORT_ERROR`, etc.

---

## Checklist

- [ ] O endpoint esta em `resources/reports/[entity]-report/`.
- [ ] Controller usa `@GET` com url `/[entities]` na rota `reports`.
- [ ] Schema Zod valida datas com regex `YYYY-MM-DD` e `transform` para Date.
- [ ] Use case usa `Promise.all` para queries paralelas.
- [ ] `groupBy` resultados sao transformados com Map para nomes legíveis.
- [ ] Porcentagem calculada com guard `total > 0`.
- [ ] Response inclui `summary`, `filters` e `generated_at`.
- [ ] Role-based filtering implementado para CURATOR.
- [ ] Authentication e Permission middleware configurados.
- [ ] Erros retornados via `left(HTTPException)` com cause code semantico.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Queries sequenciais lentas | Nao usa `Promise.all` | Agrupar todas as queries em `Promise.all([...])` |
| `NaN` na porcentagem | Divisao por zero | Adicionar guard `total > 0 ? Math.round(...) : 0` |
| Nomes ausentes no groupBy | Faltou lookup com Map | Buscar entidades relacionadas e criar Map de id → nome |
| Curator ve dados de outros | Faltou role-based filtering | Adicionar `curator_id = role === CURATOR ? user_id : undefined` |
| Data invalida no filtro | Regex nao valida formato | Usar `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` |
| `filters` null na resposta | Nao ecoou filtros aplicados | Retornar filtros com `?? null` para campos opcionais |
| Erro 500 generico | Faltou cause code | Usar `HTTPException.InternalServerError('msg', 'CAUSE_CODE')` |

---

**Cross-references:** ver [034-skill-relatorio-pdf.md](./034-skill-relatorio-pdf.md), [001-skill-use-case.md](./001-skill-use-case.md), [002-skill-controller.md](./002-skill-controller.md), [003-skill-validator.md](./003-skill-validator.md).
