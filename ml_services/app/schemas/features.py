from pydantic import BaseModel, Field
from typing import List, Optional

class DateTime(BaseModel):
    col_day: Optional[str] = Field(default=None, description="If present, will be column name that contain specifically the day part of datetime information")
    col_month: Optional[str] = Field(default=None, description="If present, will be column name that contain specifically the month part of datetime information")
    col_year: Optional[str] = Field(default=None, description="If present, will be column name that contain specifically the year part of datetime information")
    col_whole: Optional[str] = Field(default=None, description="Column name that contain the datetime information as a whole (if it is seperated leave this empty)")

    # Should we? # col_time: Optional[List[str]] | str = Field(description="If present, will be column name that contain specifically the time part of datetime information")

class FeatureEngineering(BaseModel):
    column_1: str = Field(description="Column name that would preferably appear first")
    operator: str = Field(description="Operator that would be used to transform the feature e.g. add, substract, times, divide (and only exclusive to these option)")
    column_2: str = Field(description="Column name that would appear latter (like denominator if its a division)")
    new_col_name: str = Field(description="What should the new column name be accordingly")
    reasonings: str = Field(description="Explain the reasoning behind your choice of picking column1 and 2 and the operator.")

# class Feature(BaseModel):
#     cols_to_drop: Optional[List[str]] | str = Field(default=None, description="Column name(s) that is irrelevant for Forecasting or Product Clustering. (Don't be too aggresive on picking)")
#     col_date_time: Optional[DateTime] | str = Field(default=None, description="Column name(s) that contains the datetime information.")
#     col_product: Optional[List[str]] | str = Field(default=None, description="Column name(s) that contains product information. relevant for grouping/identifying it later")
#     col_target: Optional[str] = Field(default=None, description="Column name(s) that contains target label. Reserved for forecasting only.")
#     col_to_numerical: Optional[List[str]] = Field(default=None, description="Column name(s) that should be in the form of numerical, but given the info of non numerical and need to be converted to numerical")
#     col_to_categorical: Optional[List[str]] = Field(default=None, description="Column name(s) that should be in the form of categorical, but given the info of non categorical/object and need to be converted to categorical")
#     new_feature_pairing: Optional[List[FeatureEngineering]] = Field(default=None, description="FeatureEngineering contains informations for create new insightful and useful feature.")
    # reasonings: str = Field(description="Explain the reasoning behind your choice of excluding or including certain columns.")

class Feature(BaseModel):
    cols_to_drop: Optional[List[str]] | str = Field(description="Column name(s) that is irrelevant for Forecasting or Product Clustering. (Don't be too aggresive on picking)")
    col_date_time: Optional[DateTime] | str = Field(description="Column name(s) that contains the datetime information.")
    col_product: Optional[List[str]] | str = Field(description="Column name(s) that contains product information. relevant for grouping/identifying it later especially relevant for clustering")
    col_target: Optional[str] = Field(description="Column name(s) that contains target label. Reserved for forecasting only.")
    col_to_numerical: Optional[List[str]] = Field(description="Column name(s) that should be in the form of numerical, but given the info of non numerical and need to be converted to numerical")
    col_to_categorical: Optional[List[str]] = Field(description="Column name(s) that should be in the form of categorical, but given the info of non categorical/object and need to be converted to categorical")
    new_feature_pairing: Optional[List[FeatureEngineering]] = Field(description="FeatureEngineering contains informations to create new insightful and useful feature. that can be calculated from dataframe operations of addition, substraction, multiplication, and division of two columns.")
    reasonings: str = Field(description="IMPORTANT NOTE:  Make the explanation in Bahasia Indonesia ONLY; Explain the reasoning behind your choice when excluding or including certain columns. but make it concise and to the point, yet is easy to ingest by non-technical person.")
