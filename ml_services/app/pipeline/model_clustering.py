import pandas as pd
import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import silhouette_score
from app.controller.gemma import get_insight_from_clustering


class ClusteringPipeline:
    def __init__(self, n_clusters: int = 3, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=self.n_clusters, random_state=self.random_state)
        self.is_fitted = False

    def find_optimal_k(self, X_scaled: np.ndarray, k_range: range = range(2, 11)) -> tuple:
        """Elbow method + Silhouette per K, optimal K berdasarkan Silhouette tertinggi"""
        wcss_list = []
        silhouette_list = []

        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state)
            kmeans.fit(X_scaled)
            wcss_list.append(kmeans.inertia_)
            sil = silhouette_score(X_scaled, kmeans.labels_)
            silhouette_list.append(round(sil, 4))

        optimal_k = list(k_range)[np.argmax(silhouette_list)]
        return optimal_k, wcss_list, silhouette_list

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

    async def run(self, input_json: dict) -> dict:
        """Method utama yang dipanggil controller"""

        # 1. Convert JSON -> DataFrame
        df = pd.DataFrame(input_json["data"])
        col_product = input_json["col_product"]
        col_fitur = input_json["col_fitur"]
        n_clusters_input = input_json.get("n_clusters")

        # 2. Label encoding untuk kolom kategorikal + konversi numerik
        le = LabelEncoder()
        for col in col_fitur:
            if df[col].dtype == 'object':
                df[col] = le.fit_transform(df[col].astype(str))
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # 3. Agregasi per produk
        agg_dict = {}
        for col in col_fitur:
            if col.lower() == "discount":
                agg_dict[col] = "mean"
            else:
                agg_dict[col] = "sum"

        df_grouped = df.groupby(col_product).agg(agg_dict).reset_index()

        # 4. Pisahkan fitur
        product_names = df_grouped[col_product].tolist()
        X = df_grouped[col_fitur]

        # 5. Scale data
        X_scaled = self.scaler.fit_transform(X)

        # 6. Hitung elbow + silhouette untuk semua K
        max_k = min(10, len(df_grouped) - 1)
        optimal_k_auto, wcss_list, silhouette_list = self.find_optimal_k(
            X_scaled, k_range=range(2, max_k + 1)
        )

        # 7. Tentukan K yang dipakai
        if n_clusters_input:
            optimal_k = n_clusters_input
        else:
            optimal_k = optimal_k_auto

        # 8. Train model dengan K optimal
        self.n_clusters = optimal_k
        self.model = KMeans(n_clusters=optimal_k, random_state=self.random_state)
        self.train(X)

        # 9. Evaluate
        scores = self.evaluate(X)

        # 10. Assign cluster label
        X_scaled_final = self.scaler.transform(X)
        labels = self.model.predict(X_scaled_final).tolist()
        df_grouped["cluster"] = labels

        # 11. Susun cluster_data
        cluster_data = (
            df_grouped
            .rename(columns={col_product: "product"})
            .to_dict(orient="records")
        )

        # 12. Ringkasan per cluster untuk LLM
        cluster_summary = (
            df_grouped
            .groupby("cluster")[col_fitur]
            .mean()
            .round(2)
            .to_dict()
        )

        # 13. Kirim ke LLM
        insight = await get_insight_from_clustering(cluster_summary)

        # 14. Return hasil final
        return {
            "cluster_amount": optimal_k,
            "optimal_k": optimal_k_auto,
            "silhouette_score": scores["silhouette_score"],
            "wcss_score": scores["wcss_score"],
            "wcss_list": wcss_list,
            "silhouette_list": silhouette_list,
            "k_range": list(range(2, max_k + 1)),
            "cluster_data": cluster_data,
            "insight_summary": insight
        }

    def save(self, filepath: str):
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'config': {'n_clusters': self.n_clusters}
        }, filepath)

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.n_clusters = data['config']['n_clusters']
        self.is_fitted = True

    def predict(self, X: pd.DataFrame) -> list:
        if not self.is_fitted:
            raise ValueError("Model belum ditraining!")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled).tolist()