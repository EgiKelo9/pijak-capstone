# Pijak Capstone

Platform prediksi permintaan retail berbasis microservices, dibangun dengan Next.js, FastAPI, dan ML service mandiri yang terintegrasi dengan Google Gemini untuk insight bisnis.

---

## 🏗️ Project Structure

```
pijak_capstone/
├── frontend/                   # Next.js (React + TypeScript) — UI utama
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── .env                    # NEXT_PUBLIC_API_URL
│   ├── Dockerfile
│   └── package.json
│
├── backend/                    # FastAPI — business logic & proxy ke ML service
│   ├── app/
│   │   ├── api/
│   │   │   ├── health.py       # Health check endpoints
│   │   │   └── predict.py      # Proxy predict ke ml_services
│   │   ├── schemas/
│   │   │   ├── health.py
│   │   │   └── predict.py
│   │   └── main.py
│   ├── models_bin/             # Binary model files (tidak di-commit ke git)
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml_services/                # FastAPI — ML inference & Gemini integration
│   ├── app/
│   │   ├── api/
│   │   │   ├── gemini.py       # Gemini health check & insight generation
│   │   │   └── model.py        # Forecast endpoint (dummy moving average)
│   │   ├── schemas/
│   │   │   ├── gemini.py
│   │   │   └── model.py
│   │   └── main.py
│   ├── models_bin/             # Binary model files (tidak di-commit ke git)
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
│
├── database/
│   └── init.sql                # Inisialisasi schema PostgreSQL
│
├── .env                        # Environment variables untuk docker-compose
└── docker-compose.yml          # Orkestrasi seluruh stack
```

### Service & Port

| Service      | Teknologi            | Port |
|--------------|----------------------|------|
| `frontend`   | Next.js              | 3000 |
| `backend`    | FastAPI + Uvicorn    | 5000 |
| `ml_services`| FastAPI + Uvicorn    | 8000 |
| `db`         | PostgreSQL 15        | 5432 |
| `adminer`    | Adminer              | 8080 |

---

## 🚀 Prerequisites

- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)

*(Opsional, untuk development lokal tanpa Docker)*
- Node.js 20+ & npm (untuk frontend)
- Python 3.12+ (untuk backend & ml_services)

---

## ⚙️ Environment Variables

Buat file `.env` di root project sebelum menjalankan docker-compose:

```env
# PostgreSQL
POSTGRES_USER=pijak_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=pijak_db

# Backend
DATABASE_URL=postgresql://pijak_user:your_password@db:5432/pijak_db

# ML Services
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Catatan:** File `.env` tidak boleh di-commit ke git. Pastikan sudah ada di `.gitignore`.

---

## 🐳 Development Workflows

### Option 1: Full Stack dengan Docker (Recommended)

Jalankan seluruh stack sekaligus — Frontend, Backend, ML Services, dan Database.

```bash
# 1. Clone repository
git clone <your-repo-url>
cd pijak_capstone

# 2. Buat file .env (lihat bagian Environment Variables di atas)

# 3. Build dan jalankan semua container
docker compose up --build -d

# 4. Cek status container
docker compose ps

# 5. Lihat logs
docker compose logs -f
docker compose logs -f backend      # logs spesifik service
docker compose logs -f ml_services

# 6. Stop semua container
docker compose down
```

Setelah berjalan, akses:
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:5000/docs
- ML Service docs: http://localhost:8000/docs
- Adminer (DB): http://localhost:8080

---

### Option 2: Hybrid — Hanya Satu Service Secara Lokal

Cocok jika hanya mengerjakan satu bagian (misal frontend saja) dan ingin menghubungkannya ke server publik yang sudah berjalan.

#### Frontend

```bash
cd frontend

# Buat .env
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env

npm install
npm run dev
```

#### Backend

```bash
cd backend

# Buat .env
cat > .env << EOF
DATABASE_URL=postgresql://user:password@db.your-server.com:5432/pijak_db
ML_SERVICE_URL=https://ml.your-server.com
EOF

python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

#### ML Services

```bash
cd ml_services

# Buat .env
cat > .env << EOF
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
EOF

python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🤖 Machine Learning Models

File binary model (`.h5`, `.pt`, `.pkl`, dll.) tidak di-include dalam repository karena ukurannya besar. Letakkan file model yang sudah dilatih ke dalam direktori berikut sebelum menjalankan aplikasi:

```
backend/models_bin/
ml_services/models_bin/
```

---

## 🏥 Health Check Endpoints

| Endpoint               | Service   | Deskripsi                                      |
|------------------------|-----------|------------------------------------------------|
| `GET /health`          | Backend   | Status backend saja (ringan, untuk probe)      |
| `GET /health/full`     | Backend   | Status backend + ml_services + Gemini          |
| `GET /health/ml`       | Backend   | Status koneksi ke ml_services                  |
| `GET /health/gemini`   | Backend   | Status koneksi ke Gemini via ml_services        |
| `GET /health`          | ML Service| Status ml_services                             |
| `GET /health/gemini`   | ML Service| Status Gemini API langsung                     |

**Response codes:** `200 OK` jika healthy, `503 Service Unavailable` jika ada dependency yang tidak bisa dijangkau.

---

## 📄 License

[Insert License Here]
