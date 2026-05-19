import random
from datetime import date, timedelta
from app.schemas.model import ForecastItem, ForecastResult, ForecastDay

def generate_dummy_forecast(item: ForecastItem, horizon: int) -> ForecastResult:
    """Fungsi dummy untuk menghasilkan forecast acak berdasarkan data historis."""
    history = item.historical_sales or [100.0]
    base = sum(history) / len(history) if history else 100.0

    forecasts = []
    today = date.today()

    for i in range(1, horizon + 1):
        noise = random.uniform(-0.15, 0.20)
        predicted = round(max(0.0, base * (1 + noise)), 2)
        lower_ci = round(max(0.0, predicted * 0.85), 2)
        upper_ci = round(predicted * 1.15, 2)
        
        forecasts.append(ForecastDay(
            date=(today + timedelta(days=i)).isoformat(),
            predicted_qty=predicted,
            lower_ci=lower_ci,
            upper_ci=upper_ci
        ))

    # Trend logic
    if len(forecasts) >= 6:
        first3 = sum(f.predicted_qty for f in forecasts[:3]) / 3
        last3 = sum(f.predicted_qty for f in forecasts[-3:]) / 3
        if last3 > first3 * 1.05:
            trend = "up"
        elif last3 < first3 * 0.95:
            trend = "down"
        else:
            trend = "stable"
    else:
        trend = "stable"

    restock_alert = any(f.predicted_qty < base * 0.80 for f in forecasts)

    return ForecastResult(
        product_id=item.product_id,
        product_name=item.product_name,
        forecast=forecasts,
        trend=trend,
        restock_alert=restock_alert
    )