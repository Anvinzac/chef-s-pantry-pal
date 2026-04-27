# Deploying the Express API to Railway

The frontend stays on Lovable. Only `server/` (Express + SQLite) deploys to Railway.

> ⚠️ **Heads-up:** the live app currently uses **Lovable Cloud (Supabase)** for
> auth, multi-restaurant tenancy, and the seeded accounts (`truong@quanchay.la`,
> `vu@vinha.bep`, …). The Express server in `server/` is a **separate, simpler
> backend** that does NOT yet know about restaurants or those accounts. Deploying
> it to Railway gives you an independent SQLite-backed API — useful for
> experiments or self-hosting, but it will not replace Supabase out of the box.

## 1. Create the Railway project

1. Push this repo to GitHub.
2. Go to <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
3. Pick this repository. Railway auto-detects `railway.json` + `nixpacks.toml`.

## 2. Add a persistent Volume (required for SQLite)

Without a volume, the SQLite file is wiped on every deploy.

1. In your Railway service → **Volumes** → **New Volume**.
2. Mount path: `/app/data`
3. Size: 1 GB is plenty to start.

## 3. Set environment variables

In Railway → service → **Variables**:

| Variable | Value | Why |
|---|---|---|
| `DATA_DIR` | `/app/data` | Tells SQLite to write inside the mounted volume |
| `ALLOWED_ORIGINS` | `https://bep.quanchay.la,https://bepla.lovable.app` | CORS allow-list (comma-separated, no trailing slash) |
| `PORT` | *(leave unset)* | Railway injects this automatically |

## 4. Deploy & grab the URL

Railway will build and deploy. Once green, click **Settings → Networking →
Generate Domain**. You get something like `https://bep-api.up.railway.app`.

Verify it works:
```bash
curl https://bep-api.up.railway.app/health
# → {"ok":true,"ts":...}
```

## 5. Point the frontend at the new API (optional)

The current Lovable app does NOT use this Express server — it talks to Supabase.
If you want a part of the UI to use the Railway API instead, set this env var
in Lovable → **Project Settings → Environment Variables**:

```
VITE_API_URL=https://bep-api.up.railway.app
```

Then any code using `src/lib/api.ts` will hit Railway.

## 6. Local development

Nothing changes locally — `npm run dev:all` still runs both the Vite frontend
and the Express server on port 3001, with the SQLite file in `./data/`.
