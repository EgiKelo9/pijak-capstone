from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.main import Base

class ClusteringResult(Base):
    __tablename__ = "clustering_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(Integer, ForeignKey("analysis_history.id", ondelete="CASCADE"), unique=True, nullable=True)
    cluster_amount = Column(Integer, nullable=False)
    silhouette_score = Column(Float, nullable=True)
    wcss_score = Column(Float, nullable=True)
    cluster_data = Column(JSONB, nullable=False)
    insight_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    analysis = relationship("AnalysisHistory", backref="clustering_result", uselist=False)

    def delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        return self