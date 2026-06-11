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

class DatasetSummary(BaseModel):
    id: int
    dataset_name: str

    class Config:
        from_attributes = True


class DatasetFetchByUserResponse(BaseModel):
    datasets: list[DatasetSummary]

    class Config:
        from_attributes = True

class DatasetFeatureMetadataUpdateResponse(BaseModel):
    status: str

    class Config:
        from_attributes = True

class ProcessDatasetRequest(BaseModel):
    dataset_id: int
    model_type: str
    force_reload: bool = False