from pydantic import BaseModel

class DatasetUploadResponse(BaseModel):
    dataset_id: int
    filename: str

    class Config:
        from_attributes = True