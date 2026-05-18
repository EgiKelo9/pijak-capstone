# Pijak Capstone

Platform prediksi permintaan retail berbasis microservices, dibangun dengan Next.js, FastAPI, dan ML service mandiri yang terintegrasi dengan Google Gemma (via Ollama) untuk insight bisnis.

---

## 🏗️ Project Structure

```
pijak_capstone/
├── frontend/                   # Next.js (React + TypeScript) — UI utama
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── hooks/
│   ├── Dockerfile
│   └── package.json
│
├── backend/                    # FastAPI — business logic & proxy ke ML service
│   ├── app/
│   │   ├── controller/         # Logic untuk setiap endpoint
│   │   ├── core/               # Konfigurasi aplikasi (environment configs)
│   │   ├── database/           # Koneksi dan setup database
│   │   ├── middleware/         # Custom middlewares (CORS, dsb.)
│   │   ├── models/             # Schema/ORM Models (User, Dataset, etc.)
│   │   ├── router/             # Definisi API routes
│   │   ├── schemas/            # Pydantic schemas untuk validasi IO
│   │   └── shared/             # Dependencies dan utilities (mis. dependencies.py)
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml_services/                # FastAPI — ML inference & Gemma integration
│   ├── app/
│   │   ├── controller/         # Logic untuk model ML dan Gemma
│   │   ├── core/               # Konfigurasi ML settings (Ollama URL, model path)
│   │   ├── router/             # Definisi API routes (gemma.py, model.py)
│   │   └── schemas/            # Pydantic schemas
│   ├── artifacts/              # File binary / saved model (h5, pkl, dsb.)
│   ├── .env
│   ├── Dockerfile
│   └── requirements.txt
│
├── .env                        # Environment variables untuk docker-compose
└── docker-compose.yml          # Orkestrasi seluruh stack
```

### Service & Port

| Service      | Teknologi             | Port |
|--------------|-----------------------|------|
| `frontend`   | Next.js               | 3000 |
| `backend`    | FastAPI + Uvicorn     | 5000 |
| `ml_services`| FastAPI + Uvicorn     | 8000 |
| `db`         | PostgreSQL 15         | 5432 |
| `adminer`    | Adminer               | 8080 |
| `gemma-llm`  | Ollama + Google Gemma | 8080 |

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

# ML Services (Ollama & Gemma Local Server)
OLLAMA_BASE_URL=http://host.docker.internal:11434/api/generate
LLM_MODEL=gemma:2b

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
OLLAMA_BASE_URL=http://localhost:11434/api/generate
LLM_MODEL=gemma:2b
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
ml_services/artifacts/
```

---

## 🏥 Health Check Endpoints

| Endpoint               | Service   | Deskripsi                                      |
|------------------------|-----------|------------------------------------------------|
| `GET /health`          | Backend   | Status backend saja (ringan, untuk probe)      |
| `GET /health/full`     | Backend   | Status backend + ml_services + Gemma           |
| `GET /health/ml`       | Backend   | Status koneksi ke ml_services                  |
| `GET /health/gemma`    | Backend   | Status koneksi ke Gemma via ml_services        |
| `GET /health`          | ML Service| Status ml_services                             |
| `GET /health/gemma`    | ML Service| Status Gemma API / Ollama langsung             |

**Response codes:** `200 OK` jika healthy, `503 Service Unavailable` jika ada dependency yang tidak bisa dijangkau.

---

## 📄 License

[Insert License Here]
