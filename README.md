# Cổ Chân Nhân Minecraft Wiki

Next.js 16 + shadcn/ui, chạy public tại `https://ccn.andyanh.id.vn/wiki`.

## Chạy local

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Local không cần `NEXT_PUBLIC_BASE_PATH`; Docker production build với `/wiki`.

## Rebuild trên server

Source production nằm tại `/opt/minecraft-wiki-ccn`. Sau khi đồng bộ file đã sửa:

```bash
cd /opt/minecraft-wiki-ccn
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 wiki
```

Compose dùng cache pnpm, bind duy nhất `192.168.1.16:3010`, có healthcheck và
`restart: unless-stopped`. File `.env` production chứa cấu hình Supabase, phải giữ
quyền `600` và không commit/upload công khai.
