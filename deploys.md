```bash
for dir in admin-labic demo develop edujs homolog intranet lab-gestor landing-page net-labic saneago; do
  echo "=== $dir ==="
  echo "--- .env ---"
  cat $dir/.env 2>/dev/null || echo "(sem .env)"
  echo "--- docker-compose.production.yml ---"
  cat $dir/docker-compose.production.yml 2>/dev/null || echo "(sem docker-compose.production.yml)"
  echo
done
```

=== admin-labic ===
--- .env ---
ENVIRONMENT=admin-labic
NODE_ENV=production
API_HOST=api.admin-labic.3ck.org
APP_HOST=admin-labic.3ck.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=admin-labic
DB_PASSWORD=l0wc0d3js
DB_NAME=admin-labic
DATABASE_URL=mongodb://admin-labic:l0wc0d3js@mongo:27017/admin-labic?authSource=admin
APP_SERVER_URL=https://api.admin-labic.3ck.org
APP_CLIENT_URL=https://admin-labic.3ck.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.3ck.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.admin-labic.3ck.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.admin-labic.3ck.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.admin-labic.3ck.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== demo ===
--- .env ---
ENVIRONMENT=demo
NODE_ENV=production
API_HOST=api.demo.lowcodejs.org
APP_HOST=demo.lowcodejs.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=demo
DB_PASSWORD=l0wc0d3js
DB_NAME=demo
DATABASE_URL=mongodb://demo:l0wc0d3js@mongo:27017/demo?authSource=admin
APP_SERVER_URL=https://api.demo.lowcodejs.org
APP_CLIENT_URL=https://demo.lowcodejs.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.lowcodejs.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.demo.lowcodejs.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.demo.lowcodejs.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.demo.lowcodejs.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== develop ===
--- .env ---
ENVIRONMENT=develop
NODE_ENV=production
API_HOST=api.develop.lowcodejs.org
APP_HOST=develop.lowcodejs.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=develop
DB_PASSWORD=l0wc0d3js
DB_NAME=develop
DATABASE_URL=mongodb://develop:l0wc0d3js@mongo:27017/develop?authSource=admin
APP_SERVER_URL=https://api.develop.lowcodejs.org
APP_CLIENT_URL=https://develop.lowcodejs.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.lowcodejs.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.develop.lowcodejs.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.develop.lowcodejs.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.develop.lowcodejs.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== edujs ===
--- .env ---
ENVIRONMENT=edujs
IMAGE_TAG=develop
NODE_ENV=production
API_HOST=api.edujs.cett.dev.br
APP_HOST=edujs.cett.dev.br
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=edujs
DB_PASSWORD=l0wc0d3js
DB_NAME=edujs
DATABASE_URL=mongodb://edujs:l0wc0d3js@mongo:27017/edujs?authSource=admin
APP_SERVER_URL=https://api.edujs.cett.dev.br
APP_CLIENT_URL=https://edujs.cett.dev.br
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.cett.dev.br
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.edujs.cett.dev.br
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.edujs.cett.dev.br/storage/logo-small.webp
LOGO_LARGE_URL=https://api.edujs.cett.dev.br/storage/logo-large.webp
--- docker-compose.production.yml ---
name: edujs-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${IMAGE_TAG:-develop}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@mongo:27017/${DB_NAME}?authSource=admin
      DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-network"
      - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST}`)" - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver" - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${IMAGE_TAG:-develop}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true" - "traefik.docker.network=traefik-network" - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web" - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== homolog ===
--- .env ---
ENVIRONMENT=homolog
NODE_ENV=production
API_HOST=api.homolog.lowcodejs.org
APP_HOST=homolog.lowcodejs.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=homolog
DB_PASSWORD=l0wc0d3js
DB_NAME=homolog
DATABASE_URL=mongodb://homolog:l0wc0d3js@mongo:27017/homolog?authSource=admin
APP_SERVER_URL=https://api.homolog.lowcodejs.org
APP_CLIENT_URL=https://homolog.lowcodejs.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.lowcodejs.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.homolog.lowcodejs.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.homolog.lowcodejs.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.homolog.lowcodejs.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== intranet ===
--- .env ---
ENVIRONMENT=intranet
NODE_ENV=production
API_HOST=api.intranet.lowcodejs.org
APP_HOST=intranet.lowcodejs.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=intranet
DB_PASSWORD=l0wc0d3js
DB_NAME=intranet
DATABASE_URL=mongodb://intranet:l0wc0d3js@mongo:27017/intranet?authSource=admin
APP_SERVER_URL=https://api.intranet.lowcodejs.org
APP_CLIENT_URL=https://intranet.lowcodejs.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.lowcodejs.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.intranet.lowcodejs.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.intranet.lowcodejs.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.intranet.lowcodejs.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== lab-gestor ===
--- .env ---
ENVIRONMENT=lab-gestor
NODE_ENV=production
API_HOST=api.labgestor.3ck.org
APP_HOST=labgestor.3ck.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=lab-gestor
DB_PASSWORD=l0wc0d3js
DB_NAME=lab-gestor
DATABASE_URL=mongodb://lab-gestor:l0wc0d3js@mongo:27017/lab-gestor?authSource=admin
APP_SERVER_URL=https://api.labgestor.3ck.org
APP_CLIENT_URL=https://labgestor.3ck.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.3ck.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.labgestor.3ck.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.labgestor.3ck.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.labgestor.3ck.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== landing-page ===
--- .env ---
(sem .env)
--- docker-compose.production.yml ---
(sem docker-compose.production.yml)

=== net-labic ===
--- .env ---
ENVIRONMENT=net-labic
NODE_ENV=production
API_HOST=api.net.labic.3ck.org
APP_HOST=net.labic.3ck.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=net-labic
DB_PASSWORD=l0wc0d3js
DB_NAME=net-labic
DATABASE_URL=mongodb://net-labic:l0wc0d3js@mongo:27017/net-labic?authSource=admin
APP_SERVER_URL=https://api.net.labic.3ck.org
APP_CLIENT_URL=https://net.labic.3ck.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.3ck.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.net.labic.3ck.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.net.labic.3ck.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.net.labic.3ck.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#

=== saneago ===
--- .env ---
ENVIRONMENT=saneago
NODE_ENV=production
API_HOST=api.admin-saneago.3ck.org
APP_HOST=admin-saneago.3ck.org
PORT=3000
DOCKER_USERNAME=marcosjhollyfer
DB_USERNAME=saneago
DB_PASSWORD=l0wc0d3js
DB_NAME=saneago
DATABASE_URL=mongodb://saneago:l0wc0d3js@mongo:27017/saneago?authSource=admin
APP_SERVER_URL=https://api.admin-saneago.3ck.org
APP_CLIENT_URL=https://admin-saneago.3ck.org
JWT_PRIVATE_KEY=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQzNBdklVNEFYcFpkQTIKMnpSTEFoTzZSampxNkpwL0Y2N3U3MktRbmRWUDJyd05UU0U2YWorbUNyR2UzYW5rbWk0amtkdjZVcTFtSW00VApLclRHaW04dTkyOE05cUo3RWtMZmVEbGc0aUFPQXdaREJLZnV3SXZ3K1RXTHJ1dHJnUHRBVkx4OTdUOGtjZXYyClk3OW9LaExoWENTdlZNTmhRTkJtUzAzRElyeDRZMjQzbFhHTUUwcWVhZHVnUXlocGRBdlNJeVBPY3JQM0c1VGIKWmRZa2RZNGl3c2lXL2VmMFdta1doc1ZIeHg4NmdRaEJxOHYzSWQ0Q3liR0lsbnlwUWo4UGJTT25FTmdjcDBJTwp4MkU3UENoOEo0M2NrRU0ybG03YU11b1NneFRQOEJPSUNXK051TXNjVVdZYTZWL1ErOVp0UnNjTEJoV2JpTjVlCjdRcVZOWVNiQWdNQkFBRUNnZ0VBQllPR3RKOU5Qa3R0ZXdHZXNUWFdUMUhuVEJpRzh4Wk5GSERNNk91QWJqLzYKVTNKRDhvVVo5dEF5cXNVbDViZkpkUlBqYTBiTFo1elk4U1hqdldtVlVQWnVkNWNFclMyUEt6bHRqU0F5OUFrZQpTcTJjdTZJOGRSMmxBZGpheWVuZ1ovOUZrSXV4ejlESTJhc0dyTVk3dkdOd3pZR0J3Mi9XOTRZRVNVRkdLV0JVCmVmNXB2cC96RS95MmJoRGVZTVErL05YdCt4eXRpb3p6TDE0RGVMeVF1UWxtUnNYVDdsbyszZC8rMXl1QnN1UUcKZVNzMjExQmlhaGFsNkI5dVN2TjFKbTBROFdpdjF6SGNNNmt5Vnp4Qlc4RDNpeXRZcWtYbGhWVWgwOHhRUDR3dgpZanlCUGFXNzcyUWtIYllwZjV1NXljL3R0SWIwY2IrNmNXZXVUNEEzclFLQmdRRGJseTcxSmdPZ2JsMWdFa0lUCnpZaEcvL0lhZjUxYjk2WVVqV2VVNWYrSGY3RmJLQkJhd2lXSDVoQzVSRWszV08vd2E0Z0Zoa25lOFd6cXd0WU8KUUFMdUx0SktCbGNKU3ZzM25CZGdNZys2TllrdUFrK25hYWE0cFlER3pvSDNHZXpUUUxqWktJVjBLK3pkY2p1dgpGTlRuS3lNc0NnajhEdG1mK3dBYzR2NWJQd0tCZ1FEVld4MTEyS1k3QkxUNlFTVmtBUWpITllRN2l3bGhMSE1qCkN3QnFQeXRaM0d4MzJSbXNCN2puSTBFZTIxRzJDdlk5ZWJ6VVQxMHZicE1xb3BKcVY2V1pYbGNmbERLTUlMd0EKWmF1cEV6V1BKRWlCYWo4VEFFVmYwOEtsMWRpSFZOaXJRS2J3ZkFYU0Y5eTRwazhFTWsxQ3IyaVVJMU56MDVVWAovdWpobldjTHBRS0JnUURZa3pKNERLY1ZDdVREUlI2d28wemVJYjhwaldXbytBWndUTXExVzJaN3dHQXU5TU8wCmo3a3VZS1ZyNUVLRitReWt4Wm1oUVVJSVJYclR5NWdNOCtzditUUGtXSDV0SnV2QWZBMitEWUhmZUwrMGhna0QKcDdzTWNBY2pqVGMzZS9WTW9ZL3VkZjJ4aDBVVlgzNG4vdGJBckpZQzhGN09JdU5XMnRyUW9yeVZSd0tCZ1FDRgpIaFpoZ3Mwa29ha3hReGhMTHdJRkdQVHFHYk8rZDNkVzgvUk1WaUY4TGJWWGlaTWs3S1NIUWszTkxOWHNtU1pOCjhQaktGc0p6WjdCV3Q1eFcwVnkzTms5eG1vdDNOcTFXS2hsU29uT1dYZk1IRy8xQ283YWxOWUNLNjhQdm5CYWIKc3ZqMXJzd0s2MnlCb1BKSUVnSjJpdTdiRHJkdzJ5QjVHa2kvQy9CUktRS0JnRjY5aDZLK2dqRXNRTXlwMVdDUApoQ1pwUGozMnhldGgwVmh6ajg3QUdVY1VMK0w3bVluWXhqSlhhNGFKZXVPTVNwSzNFRVFxdDBhdC9wbTRKWlZNCkN6a0FDNC9ETWtVTjNYdDdpQVVLWmpHUFovY3RtMFdHcHd0R21RcmQ3MVZ0WTlPMzZtK0pBZjJ4TzRTREZiVEsKUGZzSkU2Z0dxWHRyK3Q5aGVTc2ZYNWVPCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K
JWT_PUBLIC_KEY=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0d0x5Rk9BRjZXWFFOdHMwU3dJVAp1a1k0NnVpYWZ4ZXU3dTlpa0ozVlQ5cThEVTBoT21vL3BncXhudDJwNUpvdUk1SGIrbEt0WmlKdUV5cTB4b3B2Ckx2ZHZEUGFpZXhKQzMzZzVZT0lnRGdNR1F3U243c0NMOFBrMWk2N3JhNEQ3UUZTOGZlMC9KSEhyOW1PL2FDb1MKNFZ3a3IxVERZVURRWmt0Tnd5SzhlR051TjVWeGpCTktubW5ib0VNb2FYUUwwaU1qem5Lejl4dVUyMlhXSkhXTwpJc0xJbHYzbjlGcHBGb2JGUjhjZk9vRUlRYXZMOXlIZUFzbXhpSlo4cVVJL0QyMGpweERZSEtkQ0RzZGhPendvCmZDZU4zSkJETnBadTJqTHFFb01Vei9BVGlBbHZqYmpMSEZGbUd1bGYwUHZXYlViSEN3WVZtNGplWHUwS2xUV0UKbXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
COOKIE_SECRET=3685108816b16713a894866107526074ffc8d7747765c4b342c375f0fd5a1c9e
COOKIE_DOMAIN=.3ck.org
EMAIL_PROVIDER_PASSWORD=^>7j7B-~l|]7
EMAIL_PROVIDER_USER=sistemas@cett.org.br
EMAIL_PROVIDER_HOST=smtp.office365.com
EMAIL_PROVIDER_PORT=587
VITE_API_BASE_URL=https://api.admin-saneago.3ck.org
FILE_UPLOAD_MAX_SIZE=10485760
FILE_UPLOAD_ACCEPTED=jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar
FILE_UPLOAD_MAX_FILES_PER_UPLOAD=10
LOCALE=pt-br
PAGINATION_PER_PAGE=20
ALLOWED_ORIGINS=
LOGO_SMALL_URL=https://api.admin-saneago.3ck.org/storage/logo-small.webp
LOGO_LARGE_URL=https://api.admin-saneago.3ck.org/storage/logo-large.webp
--- docker-compose.production.yml ---
name: ${ENVIRONMENT}-lowcodejs

services:
mongo:
image: mongo:latest
restart: unless-stopped
environment:
MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
volumes: - mongo-volume:/data/db
networks: - traefik-network
healthcheck:
test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 60s

api:
image: ${DOCKER_USERNAME}/lowcodejs-api:${ENVIRONMENT}
environment:
NODE_ENV: production
PORT: 3000
DATABASE_URL: mongodb://${DB_USERNAME}:${DB_PASSWORD}@${ENVIRONMENT}-lowcodejs-mongo-1:27017/${DB_NAME}?authSource=admin
DB_NAME: ${DB_NAME}
      # APP_SERVER_URL: https://api.${ENVIRONMENT}.lowcodejs.org # APP_CLIENT_URL: https://${ENVIRONMENT}.lowcodejs.org
      APP_SERVER_URL: ${APP_SERVER_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
APP_CLIENT_URL: ${APP_CLIENT_URL:-https://${ENVIRONMENT}.lowcodejs.org}
JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      COOKIE_SECRET: ${COOKIE_SECRET}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      EMAIL_PROVIDER_PASSWORD: ${EMAIL_PROVIDER_PASSWORD}
      EMAIL_PROVIDER_USER: ${EMAIL_PROVIDER_USER}
      EMAIL_PROVIDER_HOST: ${EMAIL_PROVIDER_HOST}
      EMAIL_PROVIDER_PORT: ${EMAIL_PROVIDER_PORT}
      FILE_UPLOAD_MAX_SIZE: ${FILE_UPLOAD_MAX_SIZE:-10485760}
      FILE_UPLOAD_ACCEPTED: ${FILE_UPLOAD_ACCEPTED:-jpg;jpeg;png;pdf;doc;docx;xls;xlsx;txt;zip;rar}
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: ${FILE_UPLOAD_MAX_FILES_PER_UPLOAD:-10}
      LOCALE: ${LOCALE:-pt-br}
      # LOGO_SMALL_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp # LOGO_LARGE_URL: https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp
LOGO_SMALL_URL: ${LOGO_SMALL_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-small.webp}
LOGO_LARGE_URL: ${LOGO_LARGE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org/storage/logo-large.webp}
PAGINATION_PER_PAGE: ${PAGINATION_PER_PAGE:-20}
    restart: unless-stopped
    volumes:
      - storage-api-volume:/app/_storage
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      #- "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)" - "traefik.http.routers.${ENVIRONMENT}-api.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-api.entrypoints=websecure" - "traefik.http.routers.${ENVIRONMENT}-api.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-api.loadbalancer.server.port=3000"
#- "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`api.${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.rule=Host(`${API_HOST:-api.${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-api-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-api-http.middlewares=https-only@file"

app:
image: ${DOCKER_USERNAME}/lowcodejs-app:${ENVIRONMENT}
restart: unless-stopped
environment:
#VITE_API_BASE_URL: https://api.${ENVIRONMENT}.lowcodejs.org
VITE_API_BASE_URL: ${VITE_API_BASE_URL:-https://api.${ENVIRONMENT}.lowcodejs.org}
NITRO_PORT: 3000
NITRO_HOST: 0.0.0.0 # volumes: # - app-public-volume:/app/.output/public
depends_on: - api
networks: - traefik-network
healthcheck:
test: ["CMD", "curl", "-f", "http://localhost:3000"]
interval: 30s
timeout: 10s
retries: 3
start_period: 60s
labels: - "traefik.enable=true"
#- "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)"
      - "traefik.http.routers.${ENVIRONMENT}-app.entrypoints=websecure"
      - "traefik.http.routers.${ENVIRONMENT}-app.tls.certresolver=myresolver"
      - "traefik.http.services.${ENVIRONMENT}-app.loadbalancer.server.port=3000"
      #- "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${ENVIRONMENT}.lowcodejs.org`)"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.rule=Host(`${APP_HOST:-${ENVIRONMENT}.lowcodejs.org}`)" - "traefik.http.routers.${ENVIRONMENT}-app-http.entrypoints=web"
      - "traefik.http.routers.${ENVIRONMENT}-app-http.middlewares=https-only@file" # Headers anti-cache para garantir que navegadores busquem sempre a versão mais recente - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Cache-Control=no-cache, no-store, must-revalidate"
      - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Pragma=no-cache" - "traefik.http.middlewares.${ENVIRONMENT}-app-headers.headers.customResponseHeaders.Expires=0"
      - "traefik.http.routers.${ENVIRONMENT}-app.middlewares=${ENVIRONMENT}-app-headers"

volumes:
mongo-volume:
driver: local
storage-api-volume:
driver: local

# app-public-volume:

# driver: local

networks:
traefik-network:
external: true

#
