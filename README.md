# TVS-Bids

A web app where users bid on cricket match outcomes. Select your team before the match starts—once it begins, bidding is locked.

## Features

- **Login/Register** – Username and password authentication
- **Bid limits** – 30 bids for league matches, 2 for semi-finals, 1 for final
- **Match listing** – View upcoming matches with team selection
- **Time-based locking** – Bidding disabled when match start time passes
- **Bid stats** – Track remaining bids per stage

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite, JWT
- **Frontend**: React, Vite, React Router

## Setup

### Backend

```bash
cd server
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m seed_data     # Create teams and sample matches
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

### API Docs

http://localhost:8000/docs

## Project Structure

```
bids_cric/
├── server/           # FastAPI backend
│   ├── app/
│   │   ├── routers/  # auth, matches, bids, users
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   └── requirements.txt
├── client/           # React frontend
│   └── src/
│       ├── pages/    # Login, Register, Dashboard
│       ├── components/
│       └── api.js
└── README.md
```

## Adding Matches

Use the API at `POST /matches/` (requires auth) or add to `seed_data.py` and re-run.
