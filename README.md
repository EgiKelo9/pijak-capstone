# Pijak Capstone

Platform prediksi permintaan retail berbasis microservices, dibangun dengan Next.js, FastAPI, dan ML service mandiri yang terintegrasi dengan LLM (via OpenRouter/Gemini) untuk insight bisnis.

---

## 🏗️ Project Structure

```text
pijak-capstone/
├── .github/                    # GitHub Actions CI/CD workflows
│   └── workflows/
│       ├── ci.yml              # CI (Lint, Typecheck & Test)
│       └── cd.yml              # CD (Build, Push & Deploy via Tailscale SSH)
│
├── frontend/                   # Next.js (React + TypeScript) — UI Utama
│   ├── src/
│   │   ├── app/                # Next.js App Router Pages & Layouts
│   │   ├── components/         # Reusable UI Components
│   │   ├── hooks/              # Custom React Hooks
│   │   ├── lib/                # Utility files
│   │   └── services/           # Next.js Service Layer
│   ├── Dockerfile
│   └── package.json            # Managed using pnpm
│
├── backend/                    # FastAPI — Business logic & proxy ke ML service
│   ├── app/
│   │   ├── controller/         # Logic untuk setiap endpoint
│   │   ├── core/               # Konfigurasi aplikasi (environment configs)
│   │   ├── database/           # Koneksi dan setup database
│   │   ├── middleware/         # Custom middlewares (CORS, dsb.)
│   │   ├── models/             # Schema/ORM Models (User, Dataset, etc.)
│   │   ├── router/             # Definisi API routes
│   │   ├── schemas/            # Pydantic schemas untuk validasi IO
│   │   └── shared/             # Dependencies dan utilities
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml_services/                # FastAPI — ML inference & LLM integration
│   ├── app/
│   │   ├── controller/         # Logic untuk model ML dan LLM
│   │   ├── core/               # Konfigurasi ML settings (OpenRouter, Gemini, model path)
│   │   ├── router/             # Definisi API routes
│   │   ├── pipeline/           # Fungsi & Class untuk pipeline machine learning
│   │   └── schemas/            # Pydantic schemas
│   ├── Dockerfile
│   └── requirements.txt
│
├── .env.example                # Template file environment variables
├── docker-compose.yml          # Orkestrasi development stack (build lokal)
└── docker-compose.prod.yml     # Orkestrasi production stack (pull image dari ghcr.io)
```

### Service & Port

| Service      | Teknologi             | Port (Dev/Local) | Port (Prod/Internal) |
|--------------|-----------------------|------------------|----------------------|
| `frontend`   | Next.js               | 3000             | 3000                 |
| `backend`    | FastAPI + Uvicorn     | 5000             | 5000                 |
| `ml_services`| FastAPI + Uvicorn     | 8000             | 8000                 |
| `db`         | PostgreSQL 15         | 5432             | 127.0.0.1:5432       |
| `adminer`    | Adminer (DB Admin)    | 8080             | 127.0.0.1:8080       |

---

## 🚀 Prerequisites

- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)

*(Opsional, untuk development lokal tanpa Docker)*
- Node.js 20+ & [pnpm](https://pnpm.io/) (untuk frontend)
- Python 3.12+ (untuk backend & ml_services)

---

## ⚙️ Environment Variables

Buat file `.env` di root project sebelum menjalankan docker-compose (atau salin dari `.env.example`):

```bash
cp .env.example .env
```

Isi variabel penting seperti `SECRET_KEY`, `OPEN_ROUTER_API_KEY`, dan `GEMINI_API_KEY` pada file `.env` tersebut.

---

## 🐳 Development Workflows

### Opsi 1: Full Stack dengan Docker Compose (Direkomendasikan)

Jalankan seluruh stack sekaligus secara lokal dengan auto-build:

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

Setelah berjalan, akses layanan di browser:
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:5000/docs
- **ML Service Docs**: http://localhost:8000/docs
- **Adminer (Database Admin)**: http://localhost:8080

---

### Opsi 2: Hybrid / Pengembangan Mandiri secara Lokal

Cocok jika Anda ingin mengembangkan salah satu service saja secara lokal.

#### Frontend
Pastikan Anda memiliki [pnpm](https://pnpm.io/) terinstall.
```bash
cd frontend

# Buat berkas .env lokal
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env
echo "NEXT_PUBLIC_ML_API_URL=http://localhost:8000/ml/v1" >> .env

pnpm install
pnpm run dev
```

#### Backend
```bash
cd backend

# Buat virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependensi & jalankan server
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

#### ML Services
```bash
cd ml_services

# Buat virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependensi & jalankan server
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🚀 CI/CD & Deployment

Proyek ini telah dikonfigurasi dengan alur otomatisasi menggunakan **GitHub Actions**:

1. **Continuous Integration (`ci.yml`)**:
   - Berjalan otomatis di setiap *push* atau *pull request* ke branch `main` dan `develop`.
   - Melakukan pemeriksaan linting, verifikasi tipe TypeScript, serta uji coba unit test pada frontend, backend, dan ml_services.
2. **Continuous Deployment (`cd.yml`)**:
   - Berjalan otomatis ketika ada *push* ke branch `main`.
   - Melakukan build Docker image untuk ketiga service utama, mengunggahnya ke **GitHub Container Registry (ghcr.io)**, terhubung ke server produksi via **Tailscale**, dan melakukan deployment aman tanpa downtime menggunakan `docker-compose.prod.yml`.

Panduan konfigurasi selengkapnya dan cara setup GitHub Secrets dapat dilihat pada file:
👉 [**cicd_setup_guide.md**](file:///C:/Users/Baraja/.gemini/antigravity-ide/brain/f9fa4d13-ac3b-4178-8c25-8987b0c64b03/cicd_setup_guide.md)

---

## 🏥 Health Check Endpoints

| Endpoint               | Service   | Deskripsi                                      |
|------------------------|-----------|------------------------------------------------|
| `GET /health`          | Backend   | Status backend saja (ringan, untuk probe)      |
| `GET /health/full`     | Backend   | Status backend + ml_services + LLM             |
| `GET /health/ml`       | Backend   | Status koneksi ke ml_services                  |
| `GET /health/gemma`    | Backend   | Status koneksi ke LLM via ml_services          |
| `GET /health`          | ML Service| Status ml_services                             |
| `GET /health/gemma`    | ML Service| Status LLM API via OpenRouter/Gemini           |

---

## 📄 License

[Insert License Here]
