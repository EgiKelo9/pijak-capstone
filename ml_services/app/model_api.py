from __future__ import annotations

import random
from datetime import date, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── App ───────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _dummy_forecast(item: dict, horizon: int) -> dict:
    """
    Menghasilkan forecast dummy berbasis rata-rata historical + noise acak.
    Ganti fungsi ini dengan model ARIMA / Prophet / LSTM saat produksi.
    """
    history = item.get("historical_sales") or [100.0]
    base    = sum(history) / len(history)

    forecasts = []
    today     = date.today()

    for i in range(1, horizon + 1):
        noise     = random.uniform(-0.15, 0.20)
        predicted = round(max(0.0, base * (1 + noise)), 2)
        lower_ci  = round(max(0.0, predicted * 0.85), 2)
        upper_ci  = round(predicted * 1.15, 2)
        forecasts.append({
            "date":          (today + timedelta(days=i)).isoformat(),
            "predicted_qty": predicted,
            "lower_ci":      lower_ci,
            "upper_ci":      upper_ci,
        })

    # Tren: bandingkan rata-rata 3 hari pertama vs 3 hari terakhir
    first3 = sum(f["predicted_qty"] for f in forecasts[:3]) / 3
    last3  = sum(f["predicted_qty"] for f in forecasts[-3:]) / 3

    if last3 > first3 * 1.05:
        trend = "up"
    elif last3 < first3 * 0.95:
        trend = "down"
    else:
        trend = "stable"

    # Alert stok: jika ada hari prediksi di bawah 80% rata-rata historis
    restock_alert = any(f["predicted_qty"] < base * 0.80 for f in forecasts)

    return {
        "product_id":    item.get("product_id"),
        "product_name":  item.get("product_name"),
        "forecast":      forecasts,
        "trend":         trend,
        "restock_alert": restock_alert,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health_check():
    """Liveness probe — dipanggil oleh backend Flask setiap health check."""
    return jsonify({
        "status":  "healthy",
        "service": "ml-forecasting",
        "version": "0.1.0",
        "model":   "dummy-moving-average",
    }), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Endpoint utama forecasting.

    Request JSON:
    {
        "store_id":     "STORE-42",
        "horizon_days": 7,
        "items": [
            {
                "product_id":       "SKU-001",
                "product_name":     "Beras 5 kg",
                "historical_sales": [120, 135, 98, 150, 110]
            }
        ]
    }
    """
    payload = request.get_json(silent=True) or {}

    store_id     = payload.get("store_id", "UNKNOWN")
    horizon_days = int(payload.get("horizon_days", 7))
    items        = payload.get("items", [])

    if not items:
        return jsonify({"error": "Minimal 1 item diperlukan."}), 422

    if not (1 <= horizon_days <= 90):
        return jsonify({"error": "horizon_days harus antara 1 dan 90."}), 422

    results = [_dummy_forecast(item, horizon_days) for item in items]

    return jsonify({
        "store_id":     store_id,
        "horizon_days": horizon_days,
        "results":      results,
        "model_used":   "dummy-moving-average-v0.1",
        "note": (
            "Output ini adalah DUMMY. "
            "Ganti _dummy_forecast() dengan model ARIMA/Prophet/LSTM untuk produksi."
        ),
    }), 200


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)