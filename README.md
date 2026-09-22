# Dog Training with Emily

In-home dog training site for Houston — public pages, consult form, client portal, and trainer studio.

## Local

```bash
npm install
npm run dev
```

Opens at `http://localhost:8080`. Without `DATABASE_URL`, a local in-memory database is used.

## Vercel

Import this GitHub repo on [vercel.com](https://vercel.com). Framework: **Other** / Vite is fine — the build command is already `npm run build`.

Set environment variables (Project → Settings → Environment Variables):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon (or other Postgres) connection string |
| `BETTER_AUTH_SECRET` | a long random string |
| `BETTER_AUTH_URL` | `https://www.dogtrainingwithemily.com` |
| `VITE_AUTH_ENABLED` | `true` |

Then attach the custom domain `www.dogtrainingwithemily.com` in Vercel → Project → Settings → Domains.
