-- ============================================================
-- init.sql — Pijak Capstone: AI for Business Intelligence
-- DROP dulu agar rebuild selalu fresh (urutan terbalik dependency)
-- ============================================================

DROP TABLE IF EXISTS ml_prediction_results CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. Users — pemilik toko / wirausaha retail
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    store_name  VARCHAR(150),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. Stores — toko milik user
-- ============================================================
CREATE TABLE stores (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(150) NOT NULL,
    city       VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. Products — katalog produk per toko
-- ============================================================
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    store_id     INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    category     VARCHAR(100),             -- misal: makanan, minuman, fashion
    unit         VARCHAR(50),              -- misal: pcs, kg, lusin
    current_stock INT DEFAULT 0,
    reorder_point INT DEFAULT 10,          -- threshold minimum stok sebelum restock
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. Sales Transactions — data historis penjualan (input ML)
-- ============================================================
CREATE TABLE sales_transactions (
    id             SERIAL PRIMARY KEY,
    store_id       INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id     INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,        -- tanggal transaksi (bukan timestamp, untuk agregasi harian)
    quantity_sold  INT NOT NULL,           -- jumlah terjual
    revenue        NUMERIC(15, 2),         -- pendapatan (quantity * harga saat itu)
    uploaded_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query ML (filter by store + product + date range)
CREATE INDEX idx_sales_store_product ON sales_transactions(store_id, product_id);
CREATE INDEX idx_sales_date          ON sales_transactions(transaction_date);

-- ============================================================
-- 5. ML Prediction Results — output model time-series + insight Gemini
-- ============================================================
CREATE TABLE ml_prediction_results (
    id                  SERIAL PRIMARY KEY,
    store_id            INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id          INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    prediction_date     DATE NOT NULL,             -- tanggal kapan prediksi ini dibuat
    forecast_horizon_days INT DEFAULT 30,          -- prediksi untuk berapa hari ke depan
    predicted_demand    JSONB,                     -- array [{date, quantity}] hasil time-series
    risk_flag           VARCHAR(20) DEFAULT 'normal', -- 'out_of_stock', 'dead_stock', 'normal'
    mae                 FLOAT,                     -- Mean Absolute Error model
    rmse                FLOAT,                     -- Root Mean Squared Error model
    gemini_insight      TEXT,                      -- narasi rekomendasi dari Gemini
    gemini_model_used   VARCHAR(100),              -- nama model Gemini yang dipakai
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prediction_store    ON ml_prediction_results(store_id);
CREATE INDEX idx_prediction_date     ON ml_prediction_results(prediction_date);
CREATE INDEX idx_prediction_risk     ON ml_prediction_results(risk_flag);

-- ============================================================
-- Dummy seed data untuk development & testing
-- ============================================================
INSERT INTO users (name, email, store_name) VALUES
    ('Budi Santoso', 'budi@example.com', 'Toko Berkah Jaya'),
    ('Ani Rahayu',   'ani@example.com',  'Lapak Online Ani');

INSERT INTO stores (user_id, name, city) VALUES
    (1, 'Toko Berkah Jaya - Pusat', 'Jakarta'),
    (2, 'Lapak Online Ani',         'Bandung');

INSERT INTO products (store_id, name, category, unit, current_stock, reorder_point) VALUES
    (1, 'Mie Instan Goreng',  'makanan',  'pcs',   150, 30),
    (1, 'Air Mineral 600ml',  'minuman',  'pcs',   200, 50),
    (1, 'Sabun Mandi Batang', 'perawatan','pcs',    80, 20),
    (2, 'Kaos Polos M',       'fashion',  'pcs',    40, 10),
    (2, 'Tas Ransel Mini',    'fashion',  'pcs',    25,  5);

-- Data historis transaksi 30 hari terakhir (dummy untuk Time-Series)
INSERT INTO sales_transactions (store_id, product_id, transaction_date, quantity_sold, revenue)
SELECT
    1, 1,
    CURRENT_DATE - (generate_series(1, 30) || ' days')::INTERVAL,
    (random() * 20 + 5)::INT,
    ((random() * 20 + 5)::INT * 3500)
FROM generate_series(1, 30);

INSERT INTO sales_transactions (store_id, product_id, transaction_date, quantity_sold, revenue)
SELECT
    1, 2,
    CURRENT_DATE - (generate_series(1, 30) || ' days')::INTERVAL,
    (random() * 30 + 10)::INT,
    ((random() * 30 + 10)::INT * 5000)
FROM generate_series(1, 30);
