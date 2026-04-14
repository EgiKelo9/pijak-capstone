# Pijak Capstone

This repository contains the complete application stack for the Pijak Capstone project. The platform is built using a microservices-like architecture orchestrated via Docker Compose.

## 🏗️ Project Structure

- `frontend/`: Next.js application (React, TypeScript) serving as the user interface.
- `backend/`: Core Python API handling business logic and application state.
- `ml_services/`: Dedicated Python API for serving machine learning models.
- `database/`: SQL initialization scripts and database configurations.
- `docker-compose.yml`: Orchestrates the containers for the entire stack.

## 🚀 Prerequisites

To run this project easily, ensure you have the following installed on your system:
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

*(Optional for local non-Docker development)*
- Node.js & npm/yarn (for frontend)
- Python 3.8+ (for backend & ml_services)

## � Development Workflows

We provide two distinct workflows for our development team. Choose the one that best fits your task.

### Option 1: Full Local Environment (Docker Recommended)
Run the entire stack (Frontend, Backend, ML Services, and Database) on your own machine. This is highly recommended for full-stack features, altering the database schema, or offline development.

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <your-repo-url>
   cd pijak_capstone
   ```

2. Build and start all containers:
   ```bash
   docker compose up --build -d
   ```

3. To view logs or stop the services:
   ```bash
   docker compose logs -f
   docker compose down
   ```

### Option 2: Hybrid Local Development (Using Public Server via .env)
If you are only working on a specific portion of the app (e.g., UI/Frontend) and want a lightweight setup, you can run just that module locally and point it to our public development server infrastructure.

**1. Setup Environment Variables**
Create a `.env` file inside the specific folder you are working on (`frontend/`, `backend/`, etc.) to route connections to the public server.

*Example `.env` for Frontend:*
```env
# Point this to the Public Backend API URL
NEXT_PUBLIC_API_URL=https://api.your-public-server.com
```

*Example `.env` for Backend:*
```env
# Connect to the Public Database and ML Service
DATABASE_URL=postgresql://user:password@db.your-public-server.com:5432/pijak_db
ML_SERVICE_URL=https://ml.your-public-server.com
```

*Example `.env` for ML Services:*
```env
FLASK_APP=app/main.py
FLASK_ENV=development
PORT=5000
MODEL_PATH=models_bin/model.h5
```

**2. Run the specific service locally:**

*Frontend:*
```bash
cd frontend
npm install
npm run dev
```

*Backend & ML Services:*
```bash
cd backend # or cd ml_services
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate    # On Linux/macOS
.venv\Scripts\activate       # On Windows

pip install -r requirements.txt

# Run the API using Flask
flask run --host=0.0.0.0 --port=5000
```

## 🤖 Machine Learning Models
Large binary files (e.g., model weights like `.h5`, `.pt`, `.pkl`) are excluded from version control via `.gitignore`. 
Please place your trained models inside the respective `models_bin/` directories (`backend/models_bin/` or `ml_services/models_bin/`) before setting up the application.

## 📄 License
[Insert License Here]
