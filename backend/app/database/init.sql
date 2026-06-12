-- ============================================================
-- init.sql — Pijak Capstone: AI for Business Intelligence
-- ============================================================

CREATE DATABASE beez_pijak_db;

DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS clustering_results CASCADE;
DROP TABLE IF EXISTS forecasting_results CASCADE;
DROP TABLE IF EXISTS analysis_history CASCADE;
DROP TABLE IF EXISTS ml_models CASCADE;
DROP TABLE IF EXISTS datasets_bin CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS process_status CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Users
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL
);

-- ============================================================
-- 2. ML Models
-- ============================================================
CREATE TABLE ml_models (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(50) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL
);

-- ============================================================
-- 3. Datasets
-- ============================================================
CREATE TABLE datasets (
    id           SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_name VARCHAR(255) NOT NULL,
    file_path    TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at   TIMESTAMP NULL
);

CREATE TABLE datasets_bin (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ori_data_id     INT REFERENCES datasets_bin(id) ON DELETE SET NULL,
    is_cleaned      BOOLEAN DEFAULT FALSE,
    model           VARCHAR(50) DEFAULT NULL,
    dataset_name    VARCHAR(255) NOT NULL,
    dataset_file    BYTEA NOT NULL,
    original_encoding VARCHAR(50),
    feature_metadata  JSONB DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL
);

-- ============================================================
-- 4. Analysis History
-- ============================================================
CREATE TYPE process_status AS ENUM ('berhasil', 'gagal', 'menunggu');

CREATE TABLE analysis_history (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_id  INT REFERENCES datasets_bin(id) ON DELETE SET NULL,
    model_id    INT REFERENCES ml_models(id) ON DELETE RESTRICT,
    status      process_status DEFAULT 'berhasil',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL
);

-- ============================================================
-- 5. Forecasting Results
-- ============================================================
CREATE TABLE forecasting_results (
    id                      SERIAL PRIMARY KEY,
    analysis_id             INT UNIQUE REFERENCES analysis_history(id) ON DELETE CASCADE,
    confidence_percentage   FLOAT,
    confidence_value        FLOAT,
    mae                     FLOAT,
    mape                    FLOAT,
    mse                     FLOAT,
    rmse                    FLOAT,
    r2                      FLOAT,
    trend_data              JSONB NOT NULL,
    feature_importances     JSONB,
    metrics                 JSONB,
    insight_summary         TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP NULL
);

-- ============================================================
-- 6. Clustering Results
-- ============================================================
CREATE TABLE clustering_results (
    id               SERIAL PRIMARY KEY,
    analysis_id      INT UNIQUE REFERENCES analysis_history(id) ON DELETE CASCADE,
    cluster_amount   INT NOT NULL,
    silhouette_score FLOAT,
    wcss_score       FLOAT,
    cluster_data     JSONB NOT NULL,
    insight_summary  TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP NULL
);

-- ============================================================
-- 7. Chat Messages
-- ============================================================
CREATE TABLE chat_messages (
    id            SERIAL PRIMARY KEY,
    analysis_id   INT REFERENCES analysis_history(id) ON DELETE CASCADE,
    sender_type   VARCHAR(10) NOT NULL,
    message       TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP NULL
);

-- ============================================================
-- DUMMY DATA SEEDING
-- ============================================================

INSERT INTO users (name, email, password) VALUES
    ('Budi Santoso', 'budi@example.com', crypt('BudiPass123', gen_salt('bf'))),
    ('Ani Rahayu',   'ani@example.com',  crypt('AniPass123', gen_salt('bf'))),
    ('Baraja Putra', 'baraja@example.com', crypt('password123', gen_salt('bf'))),
    ('string', 'user@example.com', crypt('string', gen_salt('bf'))),
    ('Admin', 'admin@pijak.com', crypt('admin123', gen_salt('bf')));

INSERT INTO ml_models (name, type, description) VALUES
    ('XGBoost', 'forecasting', 'Extreme Gradient Boosting for time-series forecasting'),
    ('Prophet', 'forecasting', 'Advanced time-series forecasting developed by Meta'),
    ('K-Means', 'clustering', 'Unsupervised learning algorithm for partitioning data into K clusters'),
    ('DBSCAN', 'clustering', 'Density-Based Spatial Clustering of Applications with Noise');

INSERT INTO datasets_bin (user_id, dataset_name, dataset_file, original_encoding, is_cleaned) VALUES
    (4, 'sales_data_2023.csv', decode('53616c65732044617461', 'hex'), 'utf-8', false),
    (4, 'customer_segmentation.csv', decode('437573746f6d65722044617461', 'hex'), 'utf-8', false),
    (4, 'revenue_Q1.csv', decode('526576656e75652044617461', 'hex'), 'utf-8', false);

INSERT INTO analysis_history (user_id, dataset_id, model_id, status) VALUES
    (4, 1, 1, 'berhasil'),
    (4, 2, 3, 'berhasil'),
    (4, 3, 2, 'menunggu'),
    (4, 1, 2, 'gagal'),
    (4, 2, 4, 'berhasil'),
    (4, 3, 1, 'berhasil'),
    (4, 1, 3, 'menunggu'),
    (4, 2, 2, 'berhasil'),
    (4, 3, 4, 'gagal'),
    (4, 1, 1, 'berhasil');

INSERT INTO forecasting_results (analysis_id, confidence_percentage, confidence_value, mae, mape, mse, rmse, r2, trend_data, insight_summary) VALUES
    (1, 0.85, 12.5, 10.2, 5.5, 150.0, 12.2, 0.88, '[{"date": "2023-11-01", "value": 150}, {"date": "2023-11-02", "value": 160}]', 'Trend penjualan diperkirakan naik 5%% pada bulan depan. Fokuskan pada penambahan stok barang terlaris.'),
    (3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', 'Menunggu giliran antrean untuk dieksekusi oleh pipeline ML.'),
    (4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', 'Kolom target tidak ditemukan dalam dataset. Harap periksa kembali konfigurasi data.'),
    (6, 0.92, NULL, NULL, NULL, NULL, NULL, NULL, '[{"date": "2024-01-01", "value": 200}]', 'Terdapat tren kenaikan penjualan 15%% untuk kategori elektronik di bulan depan.'),
    (8, 0.78, NULL, NULL, NULL, NULL, NULL, NULL, '[{"date": "2024-02-01", "value": 180}]', 'Perkiraan penjualan stabil dengan sedikit fluktuasi di akhir pekan.'),
    (10, 0.88, NULL, NULL, NULL, NULL, NULL, NULL, '[{"date": "2024-03-01", "value": 210}]', 'Bulan depan diprediksi akan menjadi puncak penjualan untuk kuartal ini.');

INSERT INTO clustering_results (analysis_id, cluster_amount, silhouette_score, wcss_score, cluster_data, insight_summary) VALUES
    (2, 3, 0.65, 1250.50, '[{"cluster": 1, "size": 50, "centroid": [0.5, 0.2]}, {"cluster": 2, "size": 30, "centroid": [0.1, 0.8]}]', 'Kluster 1 memiliki daya beli tinggi. Disarankan untuk menargetkan promosi produk premium pada kelompok ini.'),
    (5, 4, 0.72, 980.20, '[{"cluster": 1, "size": 100}]', 'Ditemukan 4 kelompok utama pelanggan dengan pola keluhan yang sama pada pengiriman.'),
    (7, 0, NULL, NULL, '[]', 'Sedang memproses pengelompokan berdasarkan tingkat frekuensi dan nilai transaksi...'),
    (9, 0, NULL, NULL, '[]', 'Dataset memiliki terlalu banyak nilai kosong sehingga gagal dikelompokkan.');

INSERT INTO chat_messages (analysis_id, sender_type, message) VALUES
    (1, 'user', 'Bagaimana prediksi penjualan untuk akhir tahun?'),
    (1, 'ai', 'Berdasarkan model ARIMA, perkiraan penjualan akan melonjak di bulan Desember hingga 15% dari rata-rata.'),
    (2, 'user', 'Siapa saja anggota dari Kluster 1?'),
    (2, 'ai', 'Kluster 1 terdiri dari 50 pelanggan loyal dengan frekuensi belanja tinggi di akhir pekan.');