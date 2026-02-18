# Skill: Stats/Dashboard Endpoint

O endpoint de stats e o padrao para dashboards. Sao `GET /stats/[role]` sem filtros que executam multiplos `count()` em paralelo via `Promise.all` e retornam metricas resumidas. Existem 3 variantes por role: Administrator (ve tudo), Curator (dados filtrados por `user_id` + pendencias globais) e Artisan (dados filtrados por `artisan_id` com lookup previo). Os schemas de query sao objetos Zod vazios pois nao aceitam parametros.

---

## Estrutura do Arquivo

```
backend/
  application/
    resources/
      stats/
        administrator-stats/
          administrator-stats.controller.ts      <-- GET /stats/administrator
          administrator-stats.use-case.ts        <-- Counts sem filtros
          administrator-stats.schema.ts          <-- Schema vazio
          administrator-stats.doc.ts
        curator-stats/
          curator-stats.controller.ts            <-- GET /stats/curator
          curator-stats.use-case.ts              <-- Counts com user_id
          curator-stats.schema.ts
          curator-stats.doc.ts
        artisan-stats/
          artisan-stats.controller.ts            <-- GET /stats/artisan
          artisan-stats.use-case.ts              <-- Counts com artisan lookup
          artisan-stats.schema.ts
          artisan-stats.doc.ts
```

---

## Template: Controller

```typescript
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ERole } from '@application/core/entities';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { PermissionMiddleware } from '@application/middlewares/permissions.middleware';

@Controller({ route: 'stats' })
export default class {{Role}}StatsController {
  constructor(
    private readonly useCase = getInstanceByToken({{Role}}StatsUseCase),
  ) {}

  @GET({
    url: '/{{role}}',
    options: {
      schema: {{Role}}StatsDocumentationSchema,
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        PermissionMiddleware({ allowedRoles: [ERole.{{ROLE}}] }),
      ],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    // Administrator: sem parametros
    // Curator/Artisan: passa user_id
    const result = await this.useCase.execute(request.user.sub);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({ message: error.message, code: error.code, cause: error.cause });
    }

    return response.status(200).send(result.value);
  }
}
```

## Template: Use Case (Administrator)

```typescript
import { Service } from 'fastify-decorators';
import type { Either } from '@application/core/either';
import { left, right } from '@application/core/either';
import HTTPException from '@application/core/exception';

interface AdministratorStatsResponse {
  {{entity1_plural}}: { total: number; {{metric1}}: number; {{metric2}}: number };
  {{entity2_plural}}: { total: number };
  {{entity3_plural}}: { total: number; active: number };
  {{entity4_plural}}: { total: number };
  pending_requests: { {{entity3_plural}}: number; {{entity4_plural}}: number; {{entity1}}_updates: number };
}

type Response = Either<HTTPException, AdministratorStatsResponse>;

@Service()
export default class AdministratorStatsUseCase {
  constructor(
    private readonly {{entity1}}Repository: {{Entity1}}ContractRepository,
    private readonly {{entity2}}Repository: {{Entity2}}ContractRepository,
    private readonly {{entity3}}Repository: {{Entity3}}ContractRepository,
    private readonly {{entity4}}Repository: {{Entity4}}ContractRepository,
    private readonly {{entity3}}RequestRepository: {{Entity3}}RequestContractRepository,
    private readonly {{entity4}}RequestRepository: {{Entity4}}RequestContractRepository,
    private readonly {{entity1}}UpdateRequestRepository: {{Entity1}}UpdateRequestContractRepository,
  ) {}

  async execute(): Promise<Response> {
    try {
      const [
        total{{Entity1}}s,
        {{metric1}}{{Entity1}}s,
        total{{Entity2}}s,
        total{{Entity3}}s,
        total{{Entity4}}s,
        pending{{Entity3}}Requests,
        pending{{Entity4}}Requests,
        pending{{Entity1}}UpdateRequests,
      ] = await Promise.all([
        this.{{entity1}}Repository.count({}),
        this.{{entity1}}Repository.count({ {{metric1}}: true }),
        this.{{entity2}}Repository.count({}),
        this.{{entity3}}Repository.count({ deleted_at: null }),
        this.{{entity4}}Repository.count({ deleted_at: null }),
        this.{{entity3}}RequestRepository.count({ status: 'PENDING' }),
        this.{{entity4}}RequestRepository.count({ status: 'PENDING' }),
        this.{{entity1}}UpdateRequestRepository.count({ status: 'PENDING' }),
      ]);

      return right({
        {{entity1_plural}}: { total: total{{Entity1}}s, {{metric1}}: {{metric1}}{{Entity1}}s, {{metric2}}: total{{Entity1}}s - {{metric1}}{{Entity1}}s },
        {{entity2_plural}}: { total: total{{Entity2}}s },
        {{entity3_plural}}: { total: total{{Entity3}}s, active: total{{Entity3}}s },
        {{entity4_plural}}: { total: total{{Entity4}}s },
        pending_requests: {
          {{entity3_plural}}: pending{{Entity3}}Requests,
          {{entity4_plural}}: pending{{Entity4}}Requests,
          {{entity1}}_updates: pending{{Entity1}}UpdateRequests,
        },
      });
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'ADMINISTRATOR_STATS_ERROR'));
    }
  }
}
```

## Template: Use Case (Curator — com user_id)

```typescript
@Service()
export default class CuratorStatsUseCase {
  async execute(curatorUserId: string): Promise<Response> {
    try {
      const [
        myApprovedPieceRequests,
        myRejectedPieceRequests,
        // ... mais counts filtrados por curator_id
        pendingPieceRequests,        // global (sem filtro de curator)
      ] = await Promise.all([
        this.pieceRequestRepository.count({ curator_id: curatorUserId, status: 'APPROVED' }),
        this.pieceRequestRepository.count({ curator_id: curatorUserId, status: 'REJECTED' }),
        this.pieceRequestRepository.count({ status: 'PENDING' }),
      ]);

      const totalApproved = myApprovedPieceRequests + myApprovedCulturalRequests + myApprovedArtisanUpdates;
      const totalRejected = myRejectedPieceRequests + myRejectedCulturalRequests + myRejectedArtisanUpdates;

      return right({
        my_actions: { total: totalApproved + totalRejected, approved: totalApproved, rejected: totalRejected },
        pending_requests: { pieces: pendingPieceRequests, total: totalPending },
      });
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'CURATOR_STATS_ERROR'));
    }
  }
}
```

## Template: Use Case (Artisan — com lookup)

```typescript
@Service()
export default class ArtisanStatsUseCase {
  async execute(artisanUserId: string): Promise<Response> {
    try {
      // Lookup: encontrar artisan entity pelo user_id
      const artisan = await this.artisanRepository.findBy({ user_id: artisanUserId, exact: true });
      if (!artisan) return left(HTTPException.NotFound('Artesao nao encontrado', 'ARTISAN_NOT_FOUND'));

      const [totalPieces, pendingRequests] = await Promise.all([
        this.pieceRepository.count({ artisan_id: artisan.id, deleted_at: null }),
        this.pieceRequestRepository.count({ artisan_id: artisan.id, status: 'PENDING' }),
      ]);

      return right({
        pieces: { total: totalPieces },
        pending_requests: { total: pendingRequests },
      });
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'ARTISAN_STATS_ERROR'));
    }
  }
}
```

---

## Exemplo Real

```typescript
// resources/stats/administrator-stats/administrator-stats.use-case.ts
@Service()
export default class AdministratorStatsUseCase {
  constructor(
    private readonly artisanRepository: ArtisanContractRepository,
    private readonly curatorRepository: CuratorContractRepository,
    private readonly pieceRepository: PieceContractRepository,
    private readonly culturalContentRepository: CulturalContentContractRepository,
    private readonly pieceRequestRepository: PieceRequestContractRepository,
    private readonly culturalContentRequestRepository: CulturalContentRequestContractRepository,
    private readonly artisanUpdateRequestRepository: ArtisanUpdateRequestContractRepository,
  ) {}

  async execute(): Promise<Response> {
    try {
      const [
        totalArtisans, approvedArtisans, totalCurators, totalPieces,
        totalCulturalContents, pendingPieceRequests,
        pendingCulturalContentRequests, pendingArtisanUpdateRequests,
      ] = await Promise.all([
        this.artisanRepository.count({}),
        this.artisanRepository.count({ approved: true }),
        this.curatorRepository.count({}),
        this.pieceRepository.count({ deleted_at: null }),
        this.culturalContentRepository.count({ deleted_at: null }),
        this.pieceRequestRepository.count({ status: 'PENDING' }),
        this.culturalContentRequestRepository.count({ status: 'PENDING' }),
        this.artisanUpdateRequestRepository.count({ status: 'PENDING' }),
      ]);

      return right({
        artisans: { total: totalArtisans, approved: approvedArtisans, pending: totalArtisans - approvedArtisans },
        curators: { total: totalCurators },
        pieces: { total: totalPieces, active: totalPieces },
        cultural_contents: { total: totalCulturalContents },
        pending_requests: {
          pieces: pendingPieceRequests,
          cultural_contents: pendingCulturalContentRequests,
          artisan_updates: pendingArtisanUpdateRequests,
        },
      });
    } catch (error) {
      return left(HTTPException.InternalServerError('Internal server error', 'ADMINISTRATOR_STATS_ERROR'));
    }
  }
}
```

**Leitura do exemplo:**

1. O administrator stats nao recebe parametros -- `execute()` sem argumentos. Ve todos os dados do sistema.
2. `Promise.all` executa 8 counts em paralelo, um para cada metrica do dashboard.
3. `count({})` com filtro vazio retorna total. `count({ approved: true })` retorna subtotal.
4. `deleted_at: null` filtra registros nao deletados (soft delete).
5. Campos derivados (`pending`) sao calculados a partir de outros: `total - approved`.
6. O controller passa `request.user.sub` apenas para Curator e Artisan, nao para Administrator.

---

## As 3 Variantes

| Variante | Parametro | Escopo | Metricas Principais |
|----------|-----------|--------|---------------------|
| Administrator | Nenhum | Global | Totais + pendencias |
| Curator | `user_id` | Pessoal + global | Acoes pessoais + pendencias globais |
| Artisan | `user_id` → lookup | Pessoal | Pecas + pendencias do artesao |

---

## Regras e Convencoes

1. **GET sem query params** -- endpoints de stats nao aceitam filtros. O schema Zod e um objeto vazio.

2. **`Promise.all` para multiplos counts** -- todas as queries de count devem ser executadas em paralelo.

3. **Repository `count()` com payload** -- use o metodo `count` do repository contract, passando filtros como objeto. `count({})` para total, `count({ field: value })` para subtotais.

4. **Campos derivados calculados** -- metricas como `pending = total - approved` sao calculadas no use case, nao em query separada.

5. **Soft delete filter** -- para entidades com soft delete, sempre filtrar `deleted_at: null` nos counts.

6. **Uma variante por role** -- cada role (ADMINISTRATOR, CURATOR, ARTISAN) tem seu proprio endpoint em `/stats/[role]`.

7. **Artisan requer lookup** -- o endpoint de artisan recebe `user_id` mas precisa resolver `artisan_id` via `findBy({ user_id })` antes dos counts.

8. **Permission middleware restrito** -- cada endpoint so permite o role correspondente: `PermissionMiddleware({ allowedRoles: [ERole.ADMINISTRATOR] })`.

9. **Either para erros** -- retornar `left(HTTPException)` com cause code: `ADMINISTRATOR_STATS_ERROR`, `CURATOR_STATS_ERROR`, `ARTISAN_STATS_ERROR`.

10. **Response plana** -- a response e um objeto plano com agrupamentos por dominio (`artisans`, `pieces`, `pending_requests`), nao um array.

---

## Checklist

- [ ] O endpoint esta em `resources/stats/[role]-stats/`.
- [ ] Controller usa `@GET` com url `/[role]` na rota `stats`.
- [ ] Schema de query e um objeto Zod vazio.
- [ ] Use case usa `Promise.all` para counts paralelos.
- [ ] Administrator: `execute()` sem parametros.
- [ ] Curator: `execute(user_id)` com filtros pessoais + globais.
- [ ] Artisan: `execute(user_id)` com lookup de artisan_id.
- [ ] Soft delete filtrado com `deleted_at: null`.
- [ ] PermissionMiddleware restrito ao role especifico.
- [ ] Response retorna objeto plano com agrupamentos por dominio.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Dashboard lento | Counts executados sequencialmente | Agrupar em `Promise.all([...])` |
| Curator ve dados de outros | Faltou filtrar por `curator_id` | Adicionar `curator_id: curatorUserId` nos counts pessoais |
| Artisan retorna 404 | Lookup de artisan nao encontrado | Verificar que artisan existe com `findBy({ user_id })` e retornar `left(NotFound)` |
| Contagem inclui deletados | Faltou filtro `deleted_at: null` | Adicionar nos counts de entidades com soft delete |
| Schema aceita query params | Schema nao esta vazio | Garantir `z.object({})` no schema |
| Permission permite outros roles | `allowedRoles` inclui role errado | Restringir para `[ERole.ROLE_ESPECIFICO]` |

---

**Cross-references:** ver [001-skill-use-case.md](./001-skill-use-case.md), [002-skill-controller.md](./002-skill-controller.md), [009-skill-repository.md](./009-skill-repository.md), [040-skill-skeleton-loading.md](./040-skill-skeleton-loading.md).
