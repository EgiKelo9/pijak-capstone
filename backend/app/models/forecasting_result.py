from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.main import Base

class ForecastingResult(Base):
    __tablename__ = "forecasting_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analysis_history.id", ondelete="CASCADE"), unique=True, nullable=True)
    confidence_percentage = Column(Float, nullable=True)
    confidence_value = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    mse = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    trend_data = Column(JSONB, nullable=False)
    feature_importances = Column(JSONB, nullable=True)
    metrics = Column(JSONB, nullable=True)
    insight_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    analysis = relationship("AnalysisHistory", backref="forecasting_result", uselist=False)

    def delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        return self