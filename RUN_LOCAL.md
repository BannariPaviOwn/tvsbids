# Run Locally (no Neon needed)

## Backend (uses SQLite via .env.local)

```bash
cd server
.\run_local.bat
```

This creates `.env.local` with `DATABASE_URL=` (empty) so SQLite is used. The script seeds the DB and starts the server.

Or manually:
```bash
cd server
# Create .env.local with DATABASE_URL= (or run_local.bat does this)
python -m seed_data --local
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend: http://127.0.0.1:8000

## Frontend

```bash
cd client
npm run dev
```

Frontend: http://localhost:5173 (proxies /api to backend)

## Production (Render + Vercel)

- **Render**: Set `DATABASE_URL` to your Neon connection string in Render env vars
- **Vercel**: Set `VITE_API_URL=https://tvsbids.onrender.com`
