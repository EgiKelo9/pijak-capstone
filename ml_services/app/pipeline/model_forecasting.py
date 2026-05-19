import pandas as pd
import joblib
# import library yang dibutuhkan untuk peramalan harga produk 

class ForecastingPipeline:
    def __init__(self, order: tuple = (1, 1, 1)):
        self.order = order
        self.model = None
        self.model_fit = None # Diisi setelah training
        self.is_fitted = False

    def train(self, timeseries_data: pd.Series):
        """Melatih model peramalan berdasarkan data historis"""
        
        # TODO: Implementasi nyata sesuaikan dengan algoritma yang digunakan
        self.is_fitted = True
        return self

    def forecast(self, steps: int = 10) -> list:
        """Memprediksi N periode ke depan"""
        if not self.is_fitted:
            raise ValueError("Model peramalan belum dilatih!")
            
        # TODO: Implementasi nyata sesuaikan dengan algoritma yang digunakan
        return [0] * steps
        
    def save(self, filepath: str):
        """Menyimpan state model ke storage (Pickle/Joblib)"""
        joblib.dump(self.model_fit, filepath)

    def load(self, filepath: str):
        """Meload state model dari storage untuk melakukan inferensi"""
        self.model_fit = joblib.load(filepath)
        self.is_fitted = True