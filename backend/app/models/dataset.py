from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, LargeBinary, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database.main import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="datasets")

    def delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        return self
    
class Dataset_Bin(Base):
    __tablename__ = "datasets_bin"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ori_data_id = Column(Integer, ForeignKey("datasets_bin.id", ondelete="SET NULL"), nullable=True)
    is_cleaned = Column(Boolean, default=False)
    model = Column(String(50), nullable=True)
    dataset_name = Column(String(255), nullable=False)
    dataset_file = Column(LargeBinary, nullable=False)
    original_encoding= Column(String(55), nullable=False)
    feature_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="datasets_bin")

    def delete(self):
        self.deleted_at = datetime.now(timezone.utc)
        return self