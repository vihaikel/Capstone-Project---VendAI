-- VendAI: skema PostgreSQL (>= 12, karena memakai generated column)
-- Jalankan: psql -U postgres -d vendai -f db/schema.sql

BEGIN;

-- ============ TIPE ENUM ============
CREATE TYPE risk_tier        AS ENUM ('Rendah', 'Sedang', 'Tinggi');
CREATE TYPE main_category    AS ENUM ('Bahan Baku', 'Kustomisasi & Produksi', 'Packaging');
CREATE TYPE capacity_period  AS ENUM ('Minggu', 'Bulan');
CREATE TYPE item_unit        AS ENUM ('pcs', 'kg', 'meter');
CREATE TYPE order_status     AS ENUM ('draft', 'dipesan', 'diproduksi', 'dikirim', 'selesai', 'dibatalkan');

-- ============ DATA VENDOR & KATALOG ============
-- Level vendor: 1 baris per Supplier_ID (fitur model risiko)
CREATE TABLE vendors (
    supplier_id                     VARCHAR(20) PRIMARY KEY,
    vendor_type                     VARCHAR(40) NOT NULL,   -- Produsen/Pabrik, Konveksi UMKM, Home Industry, dst.
    financial_stability_score       NUMERIC(5,2) CHECK (financial_stability_score BETWEEN 0 AND 100),
    alternative_suppliers_available SMALLINT     CHECK (alternative_suppliers_available BETWEEN 0 AND 5),
    environmental_compliance        NUMERIC(5,2) CHECK (environmental_compliance BETWEEN 0 AND 100),
    contract_length_months          SMALLINT     CHECK (contract_length_months >= 0),
    on_time_delivery_rate           NUMERIC(5,2) CHECK (on_time_delivery_rate BETWEEN 0 AND 100),
    defect_rate                     NUMERIC(5,2) CHECK (defect_rate >= 0),
    lead_time_days                  NUMERIC(5,1) CHECK (lead_time_days >= 0),
    previous_disruptions            SMALLINT     CHECK (previous_disruptions >= 0),
    created_at                      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- Metrik boleh NULL: model mengimputasi median saat inferensi.

-- Level vendor x item (filter & ranking)
CREATE TABLE vendor_items (
    item_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id         VARCHAR(20)     NOT NULL REFERENCES vendors(supplier_id) ON DELETE CASCADE,
    main_category       main_category   NOT NULL,
    sub_category        VARCHAR(60)     NOT NULL,
    item_description    TEXT,
    unit                item_unit       NOT NULL,
    unit_price_idr      NUMERIC(14,2)   NOT NULL CHECK (unit_price_idr > 0),
    moq                 INTEGER         NOT NULL CHECK (moq > 0),
    production_capacity INTEGER         NOT NULL CHECK (production_capacity > 0),
    capacity_period     capacity_period NOT NULL,
    -- dinormalisasi (1 bulan = 4 minggu), sama seperti notebook 01
    capacity_per_week   NUMERIC GENERATED ALWAYS AS (
        CASE WHEN capacity_period = 'Minggu' THEN production_capacity ELSE production_capacity / 4.0 END) STORED,
    capacity_per_month  NUMERIC GENERATED ALWAYS AS (
        CASE WHEN capacity_period = 'Bulan'  THEN production_capacity ELSE production_capacity * 4.0 END) STORED,
    UNIQUE (supplier_id, sub_category)
);
CREATE INDEX idx_items_sub_category ON vendor_items (sub_category);
CREATE INDEX idx_items_supplier     ON vendor_items (supplier_id);

-- ============ MODEL & KONFIGURASI ============
CREATE TABLE model_versions (
    model_version_id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version          VARCHAR(20) NOT NULL UNIQUE,          -- mis. 'v1'
    model_name       VARCHAR(60) NOT NULL,                 -- HistGradientBoostingClassifier
    roc_auc          NUMERIC(5,4),
    f1               NUMERIC(5,4),
    sklearn_version  VARCHAR(20),
    artifact_path    TEXT NOT NULL,                        -- models/v1/vendai_model.pkl
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Isi dari risk_tier_config.json + ranking_config.json
CREATE TABLE ranking_configs (
    config_id             SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    model_version_id      SMALLINT NOT NULL REFERENCES model_versions(model_version_id),
    operational_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    min_tech_fails        SMALLINT     NOT NULL DEFAULT 2,
    tech_rules            JSONB NOT NULL,                  -- batas kriteria teknis
    tech_medians          JSONB NOT NULL,                  -- median data train
    weight_risk           NUMERIC(3,2) NOT NULL DEFAULT 0.50,
    weight_price          NUMERIC(3,2) NOT NULL DEFAULT 0.30,
    weight_lead_time      NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    excluded_tiers        risk_tier[]  NOT NULL DEFAULT ARRAY['Tinggi']::risk_tier[],
    is_active             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (weight_risk + weight_price + weight_lead_time = 1.00)
);
-- Hanya satu konfigurasi aktif
CREATE UNIQUE INDEX uq_ranking_configs_active ON ranking_configs (is_active) WHERE is_active;

-- Hasil model per vendor, dilacak per versi model
CREATE TABLE vendor_risk_scores (
    score_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id           VARCHAR(20) NOT NULL REFERENCES vendors(supplier_id) ON DELETE CASCADE,
    model_version_id      SMALLINT    NOT NULL REFERENCES model_versions(model_version_id),
    risk_score            NUMERIC(5,4) NOT NULL CHECK (risk_score BETWEEN 0 AND 1),
    operasional_buruk     BOOLEAN     NOT NULL,
    teknis_buruk          BOOLEAN     NOT NULL,
    kriteria_teknis_gagal JSONB       NOT NULL DEFAULT '[]',
    risk_tier             risk_tier   NOT NULL,
    scored_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (supplier_id, model_version_id)
);
CREATE INDEX idx_scores_tier ON vendor_risk_scores (risk_tier);

-- ============ USER & RIWAYAT REKOMENDASI ============
CREATE TABLE users (
    user_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_name    VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,                   -- jangan simpan password asli
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE recommendation_requests (
    request_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    main_category  main_category NOT NULL,
    sub_category   VARCHAR(60)   NOT NULL,
    quantity       INTEGER        NOT NULL CHECK (quantity > 0),
    budget         NUMERIC(16,2)  NOT NULL CHECK (budget > 0),
    deadline_days  SMALLINT       CHECK (deadline_days > 0),   -- NULL = tanpa deadline
    vendor_type    VARCHAR(40),                                -- filter opsional
    top_k          SMALLINT       NOT NULL DEFAULT 5,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_requests_user ON recommendation_requests (user_id, created_at DESC);

CREATE TABLE recommendation_results (
    request_id   BIGINT   NOT NULL REFERENCES recommendation_requests(request_id) ON DELETE CASCADE,
    rank         SMALLINT NOT NULL CHECK (rank > 0),
    supplier_id  VARCHAR(20) NOT NULL REFERENCES vendors(supplier_id),
    item_id      BIGINT   NOT NULL REFERENCES vendor_items(item_id),
    score        NUMERIC(5,4) NOT NULL,
    risk_score   NUMERIC(5,4) NOT NULL,                    -- snapshot saat rekomendasi dibuat
    risk_tier    risk_tier    NOT NULL,
    total_price  NUMERIC(16,2) NOT NULL,
    PRIMARY KEY (request_id, rank)
);

CREATE TABLE ai_explanations (
    explanation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id     BIGINT NOT NULL REFERENCES recommendation_requests(request_id) ON DELETE CASCADE,
    question       TEXT,
    answer         TEXT NOT NULL,
    llm_model      VARCHAR(60) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ PROCUREMENT & KINERJA NYATA ============
CREATE TABLE procurement_orders (
    order_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT      NOT NULL REFERENCES users(user_id),
    request_id     BIGINT      REFERENCES recommendation_requests(request_id) ON DELETE SET NULL,
    supplier_id    VARCHAR(20) NOT NULL REFERENCES vendors(supplier_id),
    item_id        BIGINT      NOT NULL REFERENCES vendor_items(item_id),
    quantity       INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price_idr NUMERIC(14,2) NOT NULL,                 -- harga saat order
    total_price    NUMERIC(16,2) GENERATED ALWAYS AS (quantity * unit_price_idr) STORED,
    status         order_status  NOT NULL DEFAULT 'draft',
    ordered_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    due_date       DATE
);
CREATE INDEX idx_orders_user ON procurement_orders (user_id, ordered_at DESC);

-- Hasil nyata tiap order; bisa jadi label asli untuk melatih ulang model
CREATE TABLE vendor_performance_log (
    order_id          BIGINT PRIMARY KEY REFERENCES procurement_orders(order_id) ON DELETE CASCADE,
    delivered_at      TIMESTAMPTZ,
    delivered_on_time BOOLEAN,
    defect_qty        INTEGER NOT NULL DEFAULT 0 CHECK (defect_qty >= 0),
    had_disruption    BOOLEAN NOT NULL DEFAULT FALSE,
    notes             TEXT
);

COMMIT;
