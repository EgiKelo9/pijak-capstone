from pydantic import BaseModel

class DatasetUploadResponse(BaseModel):
    dataset_id: int
    filename: str

    class Config:
        from_attributes = True

class DatasetFetchResponse(BaseModel):
    dataset_file: bytes
    dataset_name: str

    class Config:
        from_attributes = True