#!/usr/bin/env bash
set -euo pipefail

image=${1:?pass the locally built image}
suffix="airtrail-test-$$"
network="$suffix"
db="$suffix-db"
app="$suffix-app"
oidc="$suffix-oidc"
cleanup() {
  result=$?
  if (( result )); then
    docker logs "$app" 2>&1 || true
    docker logs "$db" 2>&1 || true
    docker logs "$oidc" 2>&1 || true
  fi
  docker rm -f -v "$app" "$db" "$oidc" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  exit "$result"
}
trap cleanup EXIT
docker network create "$network" >/dev/null
docker run -d --name "$db" --network "$network" -e POSTGRES_PASSWORD=fixture postgres:16-alpine >/dev/null
db_url="postgresql://postgres:fixture@$db/postgres"
for attempt in {1..45}; do
  if docker exec "$db" pg_isready -h 127.0.0.1 -U postgres >/dev/null; then break; fi
  sleep 1
done
docker exec "$db" pg_isready -h 127.0.0.1 -U postgres
docker run --rm --network "$network" -e DB_URL="$db_url" --entrypoint node "$image" docker/migrate.js
docker run -d --name "$oidc" --network "$network" -p 127.0.0.1:3001:3001 \
  -e E2E_OAUTH_HOST=0.0.0.0 -e E2E_OAUTH_ISSUER="http://$oidc:3001" \
  --mount "type=bind,source=$PWD/tests/e2e/oauth/fake-oidc-server.ts,target=/tmp/oidc.ts,readonly" \
  --entrypoint node "$image" --experimental-strip-types /tmp/oidc.ts
docker exec -i "$db" psql -v ON_ERROR_STOP=1 -v "oidc_issuer=http://$oidc:3001/.well-known/openid-configuration" \
  -U postgres < tests/subpath/fixture.sql

printf '\nValidating the /air deployment\n'
docker run -d --name "$app" --network "$network" -p 127.0.0.1:3000:3000 \
  -e ORIGIN=http://localhost:3000 -e DB_URL="$db_url" \
  -e UPLOAD_LOCATION=/app/uploads -e OAUTH_ALLOW_INSECURE_HTTP=true "$image"
for attempt in {1..90}; do
  if curl -fsS --max-time 3 "http://localhost:3000/air/api/ping" >/dev/null 2>&1; then break; fi
  if [[ "$(docker inspect -f '{{.State.Running}}' "$app")" != true ]]; then exit 1; fi
  sleep 1
done
docker exec "$app" airtrail-healthcheck
OIDC_TEST_ORIGIN=http://localhost:3001 node --test tests/subpath/smoke.js
if [[ "${SUBPATH_BROWSER_TEST:-0}" == 1 ]]; then
  node --test tests/subpath/browser.js
fi
