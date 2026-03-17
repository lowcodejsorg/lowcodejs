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
