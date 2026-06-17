-- ============================================================
-- init.sql — Pijak Capstone: AI for Business Intelligence
-- ============================================================

CREATE DATABASE beez_pijak_db;

-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS clustering_results CASCADE;
-- DROP TABLE IF EXISTS forecasting_results CASCADE;
-- DROP TABLE IF EXISTS analysis_history CASCADE;
-- DROP TABLE IF EXISTS ml_models CASCADE;
-- DROP TABLE IF EXISTS datasets_bin CASCADE;
-- DROP TABLE IF EXISTS datasets CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS process_status CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS ml_models (
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
CREATE TABLE IF NOT EXISTS datasets_bin (
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

CREATE TABLE IF NOT EXISTS analysis_history (
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
CREATE TABLE IF NOT EXISTS forecasting_results (
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
CREATE TABLE IF NOT EXISTS clustering_results (
    id               SERIAL PRIMARY KEY,
    analysis_id      INT UNIQUE REFERENCES analysis_history(id) ON DELETE CASCADE,
    cluster_amount   INT NOT NULL,
    optimal_k        INT,
    silhouette_score FLOAT,
    wcss_score       FLOAT,
    cluster_data     JSONB NOT NULL,
    insight_summary  TEXT,
    wcss_list        JSONB,
    silhouette_list  JSONB,
    k_range          JSONB,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP NULL
);

-- ============================================================
-- 7. Chat Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
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
    ('string', 'user@example.com', crypt('string', gen_salt('bf'))),
    ('Admin', 'admin@pijak.com', crypt('admin123', gen_salt('bf')));

INSERT INTO ml_models (name, type, description) VALUES
    ('XGBoost', 'forecasting', 'Extreme Gradient Boosting for time-series forecasting'),
    ('K-Means', 'clustering', 'Unsupervised learning algorithm for partitioning data into K clusters');