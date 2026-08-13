#!/bin/sh
set -eu

backup_dir=/opt/supabase-ccn/backups
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
umask 077
mkdir -p "$backup_dir"

docker exec supabase-db pg_dump -U postgres -d postgres --format=custom --compress=9 > "$backup_dir/postgres-$timestamp.dump"
tar -C /opt/supabase-ccn/stack -czf "$backup_dir/storage-$timestamp.tar.gz" volumes/storage
find "$backup_dir" -type f -mtime +14 -delete
