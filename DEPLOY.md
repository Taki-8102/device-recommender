# 🚀 Deployment Guide — Device Recommender

Hosting setup: **Frontend on Vercel (free)** + **Backend on Render (free)**.
Suitable for a thesis demo / defense. (Note: Render's free instance sleeps after
~15 min idle and its disk is ephemeral — the SQLite DB and uploaded shop images
reset on redeploy/restart. That is acceptable for a demo since the database
re-seeds default users automatically.)

---

## ⚠️ STEP 0 — Rotate your exposed keys first (important)

The real API keys were committed in `backend/.env`. Anyone who has seen the repo
can use them. Before (or right after) deploying:

1. **Gemini** — https://aistudio.google.com/app/apikey → delete old keys, create new.
2. **Google Custom Search** — https://console.cloud.google.com/apis/credentials → regenerate.
3. Put the **new** values only in the host dashboards (below), never back in the repo.

`.gitignore` now excludes `.env`, `venv/`, `node_modules/`, `dist/`, and `*.db`.

---

## STEP 1 — Deploy the Backend (Render)

1. Push this project to a GitHub repo.
2. Go to https://render.com → **New → Web Service** → connect the repo.
3. Render auto-detects `render.yaml`. If configuring manually instead:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:**
     `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 8 --worker-class gthread --timeout 120`
   - **Health Check Path:** `/health`
4. Under **Environment**, add these variables (use your NEW rotated keys):

   | Key | Value |
   |-----|-------|
   | `GEMINI_API_KEY` | your new Gemini key |
   | `GOOGLE_SEARCH_API_KEY` | your new Custom Search key |
   | `GOOGLE_SEARCH_CX` | your search engine ID |
   | `GOOGLE_CLIENT_ID` | your OAuth client ID |
   | `JWT_SECRET` | a long random string |
   | `PYTHON_VERSION` | `3.12.7` |

5. Deploy. When live, note the URL, e.g. `https://device-recommender-api.onrender.com`.
   Test it: visiting `<url>/health` should return `{"status": "healthy", "service": "device-recommender"}`.

---

## STEP 2 — Deploy the Frontend (Vercel)

1. Go to https://vercel.com → **Add New → Project** → import the same repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (Build `npm run build`, Output `dist` — already in `vercel.json`).
3. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your Render backend URL (Step 1, no trailing slash) |
   | `VITE_GOOGLE_CLIENT_ID` | your OAuth client ID |

4. Deploy. You'll get a URL like `https://device-recommender.vercel.app`.

> The frontend reads `VITE_API_URL` at build time. If you change it later,
> trigger a redeploy on Vercel.

---

## STEP 3 — Update Google OAuth origins

For "Sign in with Google" to work in production:

1. https://console.cloud.google.com/ → **APIs & Services → Credentials**
2. Open your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add your Vercel URL, e.g.
   `https://device-recommender.vercel.app`
4. Save (changes can take a few minutes to apply).

---

## STEP 4 — Verify

- Open the Vercel URL.
- Try a recommendation query (tests Gemini + the backend).
- Log in with the seeded demo accounts (created automatically on first DB init):
  - **Admin:** `admin` / `admin123`
  - **Shops:** `banana_it`, `jib_shop`, `lao_digital` — all password `shop123`
- Try Google login (tests OAuth origins).

---

## Local development (unchanged)

```bash
# Backend
cd backend
python -m venv venv && source venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
python app.py            # http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

With no `VITE_API_URL` set, the frontend defaults to `http://localhost:5000`,
so local dev works exactly as before.
