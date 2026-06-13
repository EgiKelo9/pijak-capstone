import pandas as pd
import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from app.controller.openrouter import get_insight_from_clustering

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

        # Pakai silhouette tertinggi untuk tentukan K optimal 
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

        # Convert JSON
        df = pd.DataFrame(input_json["data"])
        col_product = input_json["col_product"]
        col_fitur = input_json["col_fitur"]
        n_clusters_input = input_json.get("n_clusters")

        
        # Validasi dan filter col_fitur agar hanya berisi kolom numerik.
        # Kolom kategorikal (seperti city, state, dll.) tidak akan di-convert ke numeric/0,
        # melainkan tetap dipertahankan nilai string aslinya dan akan di-aggregate dengan "first".
        valid_numeric_fitur = []
        for col in col_fitur:
            if col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    valid_numeric_fitur.append(col)
                    df[col] = df[col].fillna(0)
                else:
                    converted = pd.to_numeric(df[col], errors='coerce')
                    if len(df) > 0 and converted.notna().mean() > 0.5:
                        valid_numeric_fitur.append(col)
                        df[col] = converted.fillna(0)
        col_fitur = valid_numeric_fitur

        agg_dict = {}
        for col in col_fitur:
            if col.lower() == "discount":
                agg_dict[col] = "mean"
            else:
                agg_dict[col] = "sum"

        for col in df.columns:
            if col != col_product and col not in col_fitur:
                agg_dict[col] = "first"

        df_grouped = df.groupby(col_product).agg(agg_dict).reset_index()

   
        product_names = df_grouped[col_product].tolist()
        X = df_grouped[col_fitur]

        # Scale data
        X_scaled = self.scaler.fit_transform(X)


        max_k = min(10, len(df_grouped) - 1)
        optimal_k_auto, wcss_list, silhouette_list = self.find_optimal_k(
            X_scaled, k_range=range(2, max_k + 1)
        )

        # Tentukan K yang dipakai
        if n_clusters_input:
            optimal_k = n_clusters_input
        else:
            optimal_k = optimal_k_auto

        
        self.n_clusters = optimal_k
        self.model = KMeans(n_clusters=optimal_k, random_state=self.random_state)
        self.train(X)

      
        scores = self.evaluate(X)

       
        X_scaled_final = self.scaler.transform(X)
        labels = self.model.predict(X_scaled_final).tolist()
        df_grouped["cluster"] = labels

        cluster_data = (
            df_grouped
            .rename(columns={col_product: "product"})
            .to_dict(orient="records")
        )

        # Buat ringkasan per cluster untuk LLM
        cluster_summary = (
            df_grouped
            .groupby("cluster")[col_fitur]
            .mean()
            .round(2)
            .to_dict()
        )

        # Kirim ke LLM
        insight = await get_insight_from_clustering(cluster_summary)

        # Return hasil final
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