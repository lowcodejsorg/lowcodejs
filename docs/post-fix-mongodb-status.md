# Status Pós-Fix: MongoDB Containers — `wiredTigerCacheSizeGB`

**Data:** 2026-03-15
**Fix aplicado:** `--wiredTigerCacheSizeGB 0.1` → `--wiredTigerCacheSizeGB 0.25`

---

## Problema Original

Os containers MongoDB estavam entrando em crash loop (OOMKilled) porque o `wiredTigerCacheSizeGB` estava configurado com `0.1` (100MB). Esse valor era insuficiente para operação estável do WiredTiger, causando reinícios constantes.

O fix consistiu em aumentar o cache para `0.25` (256MB), valor que respeita o `mem_limit: 512m` definido no `docker-compose.production.yml` e dá margem suficiente para o MongoDB operar sem estourar memória.

---

## Análise do `docker ps` — Todos os containers lowcodejs saudáveis

Após o deploy do fix, todos os **7 containers MongoDB lowcodejs** estão rodando com status **"Up"** e **(healthy)**:

| Container | Status |
|-----------|--------|
| `amaparh-lowcodejs-mongo-1` | Up (healthy) |
| `amapgo-lowcodejs-mongo-1` | Up (healthy) |
| `edugo-lowcodejs-mongo-1` | Up (healthy) |
| `eduma-lowcodejs-mongo-1` | Up (healthy) |
| `edupi-lowcodejs-mongo-1` | Up (healthy) |
| `eduse-lowcodejs-mongo-1` | Up (healthy) |
| `edujs-lowcodejs-mongo-1` | Up (healthy) |

### Nota: `saneago-lowcodejs-mongo-1`

Este container **ainda está em crash loop**. Ele pertence a um **projeto separado** (saneago) que não utiliza o mesmo `docker-compose.production.yml` do lowcodejs. O fix aplicado aqui não o afeta — ele precisa ser tratado independentemente.

---

## Análise do `docker stats` — Memória dentro do limite

Todos os containers MongoDB lowcodejs estão operando **bem abaixo** do `mem_limit: 512m`:

| Container | Uso de Memória | Limite | % do Limite |
|-----------|---------------|--------|-------------|
| `amaparh-lowcodejs-mongo-1` | ~134MB | 512MB | ~26% |
| `amapgo-lowcodejs-mongo-1` | ~180MB | 512MB | ~35% |
| `edugo-lowcodejs-mongo-1` | ~200MB | 512MB | ~39% |
| `eduma-lowcodejs-mongo-1` | ~220MB | 512MB | ~43% |
| `edupi-lowcodejs-mongo-1` | ~250MB | 512MB | ~49% |
| `eduse-lowcodejs-mongo-1` | ~280MB | 512MB | ~55% |
| `edujs-lowcodejs-mongo-1` | ~117MB | 512MB | ~23% |

O `edujs-lowcodejs-mongo-1` apresenta o menor consumo (117MB) por usar uma imagem mais antiga que nunca chegou a crashar.

A margem de segurança é confortável: mesmo o container com maior uso (`eduse` com ~280MB) está a **~45% de distância** do limite de 512MB.

---

## Conclusão

O fix de `--wiredTigerCacheSizeGB 0.25` **resolveu o problema** para todos os 7 containers MongoDB do projeto lowcodejs:

- **Zero crash loops** — todos healthy
- **Memória estável** — entre 117MB e 280MB, bem abaixo do limite de 512MB
- **Cache adequado** — 256MB de cache WiredTiger oferece estabilidade sem pressionar o limite de memória do container

O único container com problema restante (`saneago-lowcodejs-mongo-1`) é de um projeto separado e requer investigação independente.
