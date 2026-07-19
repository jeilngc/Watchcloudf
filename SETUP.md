# Deploying May & Jay to Cloudflare Pages (free tier)

This replaces the old Vercel + `@vercel/kv` backend with Cloudflare Pages
Functions + Cloudflare KV. Same password-gate + shared-ratings behavior,
just running on Cloudflare instead.

## Project layout
```
index.html, login.html, script.js, style.css, data.js   <- static site
functions/_middleware.js   <- gates every request behind the password
functions/_lib/auth.js     <- shared cookie/HMAC helpers (not a route)
functions/api/login.js     <- checks the password, sets the auth cookie
functions/api/logout.js    <- clears the auth cookie
functions/api/items.js     <- GET/POST the shared library (KV)
functions/api/rate.js      <- POST a rating + comment for May or Jay
```
There's no build step — this deploys as a static site with Functions.

## 1. Push this to a GitHub repo
Create a new repo (or reuse your existing one) and push all of the files
above to it, at the repo root.

## 2. Connect the repo to Cloudflare Pages
Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
→ pick the repo. Build settings:
- Framework preset: **None**
- Build command: *(leave empty)*
- Build output directory: `/`

Click **Save and Deploy**. It'll fail on the first deploy (no KV binding or
secrets yet) — that's expected, fix it in the next two steps and redeploy.

## 3. Create a KV namespace
**Workers & Pages → KV → Create namespace** — call it e.g. `mj-library`
(free tier gives you plenty of room for this).

## 4. Bind the KV namespace to your Pages project
Your Pages project → **Settings → Functions → KV namespace bindings** → Add:
- Variable name: `LIBRARY_KV`
- KV namespace: the one you just created

This name must match what `functions/api/items.js` and `functions/api/rate.js`
use (`env.LIBRARY_KV`).

## 5. Set the two secrets
Your Pages project → **Settings → Environment variables** → add for both
**Production** and **Preview**:
- `SITE_PASSWORD` — the shared password you and May will type in. Mark it
  **Encrypt**.
- `COOKIE_SECRET` — any long random string (e.g. generate one with
  `openssl rand -hex 32`). Mark it **Encrypt** too — it just signs the
  login cookie, you never type it in yourself.

## 6. Redeploy
**Deployments → Retry deployment** (or push a new commit — GitHub-connected
Pages projects redeploy on every push automatically).

## 7. Seed the library the first time
The KV store starts empty. Open the site, log in, and use the app once —
`script.js` already falls back to the seed data in `data.js` and writes it
to `/api/items` on first load, so KV gets populated automatically. After
that, every rating/comment you or May save updates the same shared KV
record, regardless of whose device it's on.

## Notes / limitations
- The "May" vs "Jay" toggle is a UI convenience only (remembered per
  browser) — since you share one password, nothing stops either of you
  from picking the other name. That's intentional to keep this simple.
- The cookie is `HttpOnly` + `Secure` + `SameSite=Lax` — not readable by
  page scripts, only sent over HTTPS.
- To rotate the password, just change `SITE_PASSWORD` — existing sessions
  stay valid (they're signed with `COOKIE_SECRET`, not the password).
  Rotate `COOKIE_SECRET` too if you want to force everyone to log back in.
- Cloudflare Pages Functions run on every request including static assets,
  so `functions/_middleware.js` now does the login redirect server-side —
  there's no more client-side `checkAuth()` fetch-and-redirect like the
  Vercel version had.
- Free-tier Cloudflare KV limits (as of writing): 100,000 reads/day and
  1,000 writes/day, which is far more than a two-person tracker needs.
