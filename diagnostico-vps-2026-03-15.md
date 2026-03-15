# Diagnóstico: Containers -app reiniciando na VPS

**Data:** 2026-03-15

---

## Contexto

Todos os ambientes de produção na VPS caem periodicamente. Apenas os containers `-app` (frontend) reiniciam — APIs e MongoDBs ficam estáveis. A VPS tem 5.8GB RAM, 30+ containers, e ZERO swap.

## Dados do Diagnóstico

### `docker stats`
- **RAM**: 5.8GB total, 4.3GB usada, 723MB livre, **sem swap**
- **MongoDB CPU anormal**: `lab-gestor-mongo` a 99.75%, `admin-labic-mongo` a 70%
- **Block I/O absurdo nos MongoDBs**: 400-500GB de leitura — queries sem índice ou dados corrompidos
- **Memory leak nas apps**: saneago-app (recém-criada) usa 49MB, develop-app (17h) usa 217MB — 4x de crescimento
- **RestartCount = 0**: containers foram **recriados**, não reiniciados por crash
- **dmesg limpo**: sem OOM kill registrado

### Cadeia de falha identificada
MongoDB frita CPU/I/O → sistema trava → Node.js não responde → healthcheck falha (3 retries × 30s) → Docker marca unhealthy → container é recriado pelo `restart: unless-stopped`

---

## Causas Raiz

### 1. Sem swap (crítico)
Com 5.8GB RAM e 30+ containers, qualquer pico de uso causa pressão de memória imediata. Sem swap, o kernel não tem margem — ou mata processos ou tudo trava.

### 2. MongoDBs sem índice ou com dados corrompidos
Dois MongoDBs consumindo 70-100% CPU e 400-500GB de block I/O é completamente anormal. Provavelmente queries fazendo full collection scan.

### 3. Healthcheck agressivo
3 retries × 30s = 90 segundos de lentidão bastam pra reiniciar o container. Quando MongoDB trava o sistema, todos os apps falham o healthcheck ao mesmo tempo.

### 4. Memory leak nos apps frontend
Apps crescem de ~50MB para ~220MB em 17h. Sem limite de memória, isso contribui para a pressão geral.

### 5. URL saneago.3ck.org (404)
A rota correta no Traefik é `admin-saneago.3ck.org`, não `saneago.3ck.org`.

---

## Correções Aplicadas no `docker-compose.production.yml`

| Serviço | Mudança | Detalhe |
|---------|---------|---------|
| **mongo** | `mem_limit: 256m` | Limita RAM do container |
| **mongo** | `command: ["mongod", "--wiredTigerCacheSizeGB", "0.1"]` | Limita cache WiredTiger (causa dos 400GB+ block I/O) |
| **mongo** | `logging` | json-file com max 10m × 3 arquivos |
| **api** | `mem_limit: 256m` | Limita RAM do container |
| **api** | `logging` | json-file com max 10m × 3 arquivos |
| **app** | `mem_limit: 256m` | Limita RAM do container |
| **app** | healthcheck relaxado | `interval: 60s`, `timeout: 15s`, `retries: 5`, `start_period: 120s` |
| **app** | `logging` | json-file com max 10m × 3 arquivos |

---

## Ação Manual Pendente: Criar Swap na VPS

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Verificação Pós-Deploy

1. `free -h` — confirmar swap ativo (deve mostrar 4GB de swap)
2. `docker stats --no-stream` — confirmar mem_limit aplicado e MongoDBs com CPU normalizada
3. Monitorar por 24-48h se os containers param de reiniciar
4. Acessar `https://admin-saneago.3ck.org` (não `saneago.3ck.org`) para verificar acesso
