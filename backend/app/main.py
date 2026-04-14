from flask import Flask, jsonify, request
import os
import requests
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# ── ENV ──────────────────────────────────────────────────────
ML_SERVICE_URL  = os.getenv("ML_SERVICE_URL",  "http://ml_services:8000")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY",  "")
GEMINI_MODEL    = os.getenv("GEMINI_MODEL",    "gemini-2.5-flash-lite")
DATABASE_URL    = os.getenv("DATABASE_URL",    "")

# Inisialisasi Gemini client (akan None jika key belum diset)
_gemini_client = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _gemini_client = genai.GenerativeModel(GEMINI_MODEL)


# ── HELPERS ──────────────────────────────────────────────────

def _check_ml_service() -> dict:
    """Ping custom ML service, return status dict."""
    try:
        resp = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        resp.raise_for_status()
        return {
            "status": "healthy",
            "url":    ML_SERVICE_URL,
            "detail": resp.json(),
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "unreachable",
            "url":    ML_SERVICE_URL,
            "detail": "Cannot connect to ML service",
        }
    except requests.exceptions.Timeout:
        return {
            "status": "timeout",
            "url":    ML_SERVICE_URL,
            "detail": "ML service did not respond within 5s",
        }
    except Exception as e:
        return {
            "status": "error",
            "url":    ML_SERVICE_URL,
            "detail": str(e),
        }

def _check_gemini() -> dict:
    """Send a minimal test prompt to Gemini, return status dict."""
    if not GEMINI_API_KEY:
        return {
            "status": "not_configured",
            "model":  GEMINI_MODEL,
            "detail": "GEMINI_API_KEY is not set",
        }
    try:
        response = _gemini_client.generate_content(
            "Balas hanya dengan kata 'OK' untuk konfirmasi koneksi.",
        )
        return {
            "status": "healthy",
            "model":  GEMINI_MODEL,
            "detail": response.text.strip(),
        }
    except Exception as e:
        return {
            "status": "error",
            "model":  GEMINI_MODEL,
            "detail": str(e),
        }

# ── ROUTES ───────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check sederhana untuk backend itu sendiri.
    Tidak memanggil service lain — cocok untuk load balancer / tunnel probe.
    """
    return jsonify({
        "status":  "healthy",
        "service": "backend-flask",
        "version": "1.0.0",
    }), 200


@app.route("/health/full", methods=["GET"])
def health_full():
    """
    Health check menyeluruh: backend + custom ML service + Gemini.
    Gunakan endpoint ini untuk debug dan monitoring dashboard.
    """
    ml_status     = _check_ml_service()
    gemini_status = _check_gemini()

    all_healthy = (
        ml_status["status"]     == "healthy" and
        gemini_status["status"] == "healthy"
    )

    return jsonify({
        "status":  "healthy" if all_healthy else "degraded",
        "service": "backend-flask",
        "dependencies": {
            "ml_service": ml_status,
            "gemini":     gemini_status,
        },
    }), 200 if all_healthy else 207


@app.route("/health/ml", methods=["GET"])
def health_ml():
    """Health check khusus custom ML service (time-series forecasting)."""
    result = _check_ml_service()
    code   = 200 if result["status"] == "healthy" else 503
    return jsonify(result), code


@app.route("/health/gemini", methods=["GET"])
def health_gemini():
    """Health check khusus Gemini 2.0 Flash Lite."""
    result = _check_gemini()
    code   = 200 if result["status"] == "healthy" else 503
    return jsonify(result), code


# ── CONTOH ENDPOINT BISNIS (placeholder) ─────────────────────

@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Endpoint utama: kirim data transaksi → dapatkan forecast + insight Gemini.
    Saat ini masih placeholder — implementasi penuh ada di sprint berikutnya.
    """
    data = request.get_json(silent=True) or {}

    # 1. Panggil ML service untuk forecasting
    try:
        ml_resp = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json=data,
            timeout=30,
        )
        ml_result = ml_resp.json()
    except Exception as e:
        return jsonify({"error": f"ML service error: {e}"}), 502

    # 2. Panggil Gemini untuk business insight
    gemini_insight = None
    if _gemini_client:
        try:
            prompt = (
                f"Kamu adalah Business Analyst untuk wirausaha retail. "
                f"Berdasarkan hasil prediksi permintaan produk berikut:\n"
                f"{ml_result}\n\n"
                f"Berikan 3 rekomendasi aksi bisnis yang konkret dan mudah "
                f"dimengerti oleh pemilik toko non-teknis. Fokus pada: "
                f"potensi kehabisan stok, produk tidak laku, dan peluang promo."
            )
            gemini_resp  = _gemini_client.generate_content(prompt)
            gemini_insight = gemini_resp.text
        except Exception as e:
            gemini_insight = f"Gemini error: {e}"

    return jsonify({
        "ml_forecast":     ml_result,
        "gemini_insight":  gemini_insight,
    }), 200


# ── ENTRYPOINT ───────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
