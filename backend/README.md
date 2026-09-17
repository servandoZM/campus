# CAMPUS — backend (Django + DRF)

## Run it locally (first time)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows   |   source venv/bin/activate  (Mac/Linux)
pip install -r requirements.txt

copy .env.example .env        # Windows   |   cp .env.example .env  (Mac/Linux)
# edit .env -> set DB_PASSWORD to your MySQL password (XAMPP's root usually has none)
```

In XAMPP's MySQL (phpMyAdmin or the console), create the database once:

```sql
CREATE DATABASE campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then:

```bash
python manage.py migrate            # creates all the tables
python manage.py createsuperuser    # your admin login
python manage.py runserver          # http://127.0.0.1:8000/admin/
```

## What's here

| Path | What it is |
|---|---|
| `campus/settings.py` | All config: MySQL via `.env`, custom user model, DRF, JWT, CORS |
| `schools/` | The multi-tenant anchor — one row per school/university |
| `users/` | Custom `User` (extends Django's) with `school`, `role`, verification flag |
| `*/admin.py` | Registers both models so they appear in the free admin panel |
| `*/migrations/` | Generated from the models — commit these, never edit by hand |

## Project layout (planned)

```
campus/
├── backend/      Django + DRF        <- this folder (now)
├── frontend/     React + Vite        <- next
└── ai-service/   FastAPI             <- later, for AI features
```
