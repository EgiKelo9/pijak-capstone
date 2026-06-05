import pandas as pd
import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from app.controller.gemma import get_insight_from_clustering

class ClusteringPipeline:
    def __init__(self, n_clusters: int = 3, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=self.n_clusters, random_state=self.random_state)
        self.is_fitted = False

# private method

    def find_optimal_k(self, X_scaled: np.ndarray, k_range: range = range(2, 11)) -> tuple:
        """Elbow method untuk mencari K optimal"""
        wcss_list = []

        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state)
            kmeans.fit(X_scaled)
            wcss_list.append(kmeans.inertia_)

        # Cari titik siku pakai second derivative
        deltas = np.diff(wcss_list)
        second_deltas = np.diff(deltas)
        optimal_k = list(k_range)[np.argmin(second_deltas) + 1]

        return optimal_k, wcss_list

    def train(self, X: pd.DataFrame):
        """Melatih scaler dan model"""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_fitted = True
        return self

    def evaluate(self, X: pd.DataFrame) -> dict:
        """Menghitung silhouette score dan WCSS"""
        if not self.is_fitted:
            raise ValueError("Model belum ditraining!")

        X_scaled = self.scaler.transform(X)
        labels = self.model.predict(X_scaled)

        sil_score = silhouette_score(X_scaled, labels)
        wcss = float(self.model.inertia_)

        return {
            "silhouette_score": round(sil_score, 4),
            "wcss_score": round(wcss, 4)
        }

# main method

    async def run(self, input_json: dict) -> dict:
        """Method utama yang dipanggil controller"""

        # 1. Convert JSON → DataFrame
        df = pd.DataFrame(input_json["data"])
        col_product = input_json["col_product"]
        col_fitur = input_json["col_fitur"]

        # 2. Agregasi per produk
        agg_dict = {}
        for col in col_fitur:
            if col.lower() == "discount":
                agg_dict[col] = "mean"
            else:
                agg_dict[col] = "sum"

        df_grouped = df.groupby(col_product).agg(agg_dict).reset_index()

        # 3. Pisahkan identifier dan fitur
        product_names = df_grouped[col_product].tolist()
        X = df_grouped[col_fitur]

        # 4. Scale data untuk elbow method
        X_scaled = self.scaler.fit_transform(X)

        # 5. Cari K optimal
        max_k = min(10, len(df_grouped) - 1)
        optimal_k, _ = self.find_optimal_k(X_scaled, k_range=range(2, max_k + 1))   

        # 6. Update model dengan K optimal lalu train
        self.n_clusters = optimal_k
        self.model = KMeans(n_clusters=optimal_k, random_state=self.random_state)
        self.train(X)

        # 7. Evaluate
        scores = self.evaluate(X)

        # 8. Assign cluster label ke tiap produk
        X_scaled_final = self.scaler.transform(X)
        labels = self.model.predict(X_scaled_final).tolist()
        df_grouped["cluster"] = labels

        # 9. Susun cluster_data
        cluster_data = (
            df_grouped
            .rename(columns={col_product: "product"})
            .to_dict(orient="records")
        )

        # 10. Buat ringkasan per cluster untuk dikirim ke LLM
        cluster_summary = (
            df_grouped
            .groupby("cluster")[col_fitur]
            .mean()
            .round(2)
            .to_dict()
        )

        # 11. Kirim ke LLM → dapat insight_summary
        insight = await get_insight_from_clustering(cluster_summary)

        # 12. Return hasil final
        return {
            "cluster_amount": optimal_k,
            "silhouette_score": scores["silhouette_score"],
            "wcss_score": scores["wcss_score"],
            "cluster_data": cluster_data,
            "insight_summary": insight
        }

# save n load

    def save(self, filepath: str):
        """Menyimpan seluruh pipeline"""
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

    def predict(self, X: pd.DataFrame) -> list:
        """Memprediksi cluster untuk data baru"""
        if not self.is_fitted:
            raise ValueError("Model belum ditraining! Panggil train() terlebih dahulu.")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled).tolist()