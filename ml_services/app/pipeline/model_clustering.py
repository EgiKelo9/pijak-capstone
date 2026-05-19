import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
# import library yang dibutuhkan untuk clustering data produk

class ClusteringPipeline:
    def __init__(self, n_clusters: int = 3, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        
        # Inisialisasi komponen yang menyimpan state
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=self.n_clusters, random_state=self.random_state)
        
        self.is_fitted = False

    def train(self, X: pd.DataFrame):
        """Melatih scaler dan model menggunakan data historis"""
        # Scale data
        X_scaled = self.scaler.fit_transform(X)
        
        # Latih dari raw Model KMeans
        self.model.fit(X_scaled)
        self.is_fitted = True
        return self

    def predict(self, X: pd.DataFrame) -> list:
        """Memprediksi cluster untuk data baru"""
        if not self.is_fitted:
            raise ValueError("Model belum ditraining! Panggil train() terlebih dahulu.")
        
        X_scaled = self.scaler.transform(X) # Gunakan nilai referensi dari data training
        predictions = self.model.predict(X_scaled)
        return predictions.tolist()

    def save(self, filepath: str):
        """Menyimpan seluruh pipeline (model + scaler)"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'config': {'n_clusters': self.n_clusters}
        }, filepath)

    def load(self, filepath: str):
        """Me-load pipeline dari disk"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.n_clusters = data['config']['n_clusters']
        self.is_fitted = True