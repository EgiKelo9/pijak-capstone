from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.main import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets_bin.id", ondelete="SET NULL"), nullable=True)
    model_id = Column(Integer, ForeignKey("ml_models.id", ondelete="RESTRICT"), nullable=True)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="analyses")
    dataset = relationship("Dataset_Bin", backref="analyses")
    model = relationship("MLModel", backref="analyses")

    def delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        return self