#!/bin/sh
set -eu

cd /opt/supabase-ccn/stack

read_env() {
  grep "^$1=" .env | head -n 1 | cut -d= -f2-
}

API_GW_HTTP_PORT=$(read_env API_GW_HTTP_PORT)
ANON_KEY=$(read_env ANON_KEY)
DASHBOARD_USERNAME=$(read_env DASHBOARD_USERNAME)
DASHBOARD_PASSWORD=$(read_env DASHBOARD_PASSWORD)

base_url="http://127.0.0.1:${API_GW_HTTP_PORT}"

request_code() {
  curl --silent --show-error --output /dev/null --write-out "%{http_code}" --max-time 15 "$@"
}

no_key_code=$(request_code "${base_url}/rest/v1/catalog_entries?select=id&limit=1" || true)
anon_read_code=$(request_code -H "apikey: ${ANON_KEY}" "${base_url}/rest/v1/catalog_entries?select=id&limit=1" || true)
anon_write_code=$(request_code -X POST -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}" -H "Content-Type: application/json" -d '{"kind":"gu","source_id":"security-test","name":"blocked","category":"test"}' "${base_url}/rest/v1/catalog_entries" || true)
studio_without_auth_code=$(request_code "${base_url}/" || true)
studio_with_auth_code=$(request_code -u "${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}" "${base_url}/" || true)
signup_code=$(request_code -X POST -H "apikey: ${ANON_KEY}" -H "Content-Type: application/json" -d '{"email":"security-check@example.invalid","password":"not-a-real-password"}' "${base_url}/auth/v1/signup" || true)

printf "no_key=%s\n" "$no_key_code"
printf "anon_read=%s\n" "$anon_read_code"
printf "anon_write=%s\n" "$anon_write_code"
printf "studio_without_auth=%s\n" "$studio_without_auth_code"
printf "studio_with_auth=%s\n" "$studio_with_auth_code"
printf "signup_disabled=%s\n" "$signup_code"
