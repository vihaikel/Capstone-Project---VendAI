# Capstone-Project---VendAI

VendAI adalah sistem rekomendasi vendor berbasis risiko untuk **toko souvenir & hampers pernikahan** (produk akhir: handuk, sajadah, t-shirt printing, bantal custom). Vendor yang direkomendasikan mencakup penyedia **bahan baku**, jasa **kustomisasi & produksi**, dan **packaging**.

Setiap vendor dinilai dari dua sisi:

- **Faktor operasional**: probabilitas risiko dari model machine learning (`Risk_Score`).
- **Faktor teknis**: aturan bisnis pada metrik pengiriman, kualitas, dan riwayat gangguan.

Gabungan kedua faktor menghasilkan **Risk Tier** (Rendah / Sedang / Tinggi) beserta alasan per vendor. Pada tahap **ranking**, vendor difilter sesuai kebutuhan user (kategori, jumlah, budget, sisa hari menuju acara), lalu diurutkan berdasarkan skor gabungan risiko, harga, dan lead time.

---

## Daftar Isi

**Bagian 1 — Setup Sistem**

1. [Prasyarat](#prasyarat)
2. [Instalasi Environment Python](#1-instalasi-environment-python)
3. [Membuat Artefak Model (Notebook 01–06)](#2-membuat-artefak-model-notebook-0106)
4. [Menyiapkan Database (PostgreSQL)](#3-menyiapkan-database-postgresql)
5. [Konfigurasi Environment API (`api_key.env`)](#4-konfigurasi-environment-api-api_keyenv)
6. [Menjalankan API (FastAPI)](#5-menjalankan-api-fastapi)
7. [Menjalankan Frontend (React + Vite)](#6-menjalankan-frontend-react--vite)
8. [Status Pengembangan](#status-pengembangan)

**Bagian 2 — Penjelasan Proyek**

1. [Gambaran Alur Sistem](#gambaran-alur-sistem)
2. [Struktur Proyek](#struktur-proyek)
3. [Dataset](#dataset)
4. [Cara Kerja per Tahap](#cara-kerja-per-tahap)
5. [Penentuan Risk Tier](#penentuan-risk-tier)
6. [Ranking Vendor](#ranking-vendor)
7. [Artefak Model](#artefak-model)
8. [Alur Inferensi untuk Vendor Baru](#alur-inferensi-untuk-vendor-baru)
9. [Keterbatasan dan Catatan](#keterbatasan-dan-catatan)

---

# Bagian 1 — Setup Sistem

## Prasyarat

| Kebutuhan | Versi | Dipakai untuk |
|---|---|---|
| Python | **3.11** | Notebook, API, seeding database |
| Node.js + npm | 18+ | Frontend (Vite) |
| PostgreSQL | 12+ | Database vendor (`db/`), sumber data frontend |
| Gemini API key | — | Endpoint penjelasan gen-AI (`/generate_explanation`) |

> Gunakan Python 3.11. Artefak model di-pickle dengan **scikit-learn 1.7.0**, dan versi scikit-learn lain bisa gagal memuatnya (contoh: `ModuleNotFoundError: No module named '_loss'`).

## 1. Instalasi Environment Python

```bash
git clone <url-repo>
cd Capstone-Project---VendAI

# pilih salah satu
python -m venv .venv                      # venv
conda create -n vendai python=3.11 -y     # atau conda

# aktivasi
.venv\Scripts\activate                    # Windows (venv)
source .venv/bin/activate                 # macOS/Linux (venv)
conda activate vendai                     # conda

pip install -r requirements.txt
```

`requirements.txt` dikelompokkan per bagian: modelling (`notebooks/`), API (`app/`), dan seeding database (`db/seed.py`). Untuk menjalankan notebook, pasang juga Jupyter atau kernel (`pip install ipykernel`) jika belum ada.

## 2. Membuat Artefak Model (Notebook 01–06)

Folder `data/processed/` dan `models/v1/` **di-ignore git**, jadi setelah clone keduanya harus dibuat ulang dengan menjalankan notebook.

1. Pastikan `data/raw/souvenir_vendor_dataset.csv` tersedia.
2. Jalankan notebook secara berurutan, masing-masing dengan **Restart & Run All**:
   `01_eda_data_quality` → `02_feature_engineering` → `03_modelling` → `04_risk_scoring` → `05_save_model` → `06_ranking`
3. Pastikan semua `assert` di notebook 05 dan 06 lolos, dan `models/v1/` berisi:

| File | Dibuat oleh | Dipakai oleh |
|---|---|---|
| `model_pipeline.pkl` | 03 | 04, 05 |
| `risk_tier_config.json` | 04 | 05, `db/seed.py` |
| `vendai_model.pkl` | 05 | 06, API |
| `vendor_catalog_scored.csv` | 06 | API (ranking), `db/seed.py` |
| `ranking_config.json` | 06 | API (ranking), `db/seed.py` |

## 3. Menyiapkan Database (PostgreSQL)

Database ini menjadi sumber data frontend (direktori, perbandingan, dan rekomendasi vendor). Prasyarat: notebook 01 dan 06 sudah dijalankan (butuh `data/processed/supplier_clean.csv` dan `models/v1/*`).

```bash
createdb -U postgres vendai
psql -U postgres -d vendai -f db/schema.sql

# Windows PowerShell: $env:DATABASE_URL="postgresql://user:pass@localhost:5432/vendai"; python db/seed.py
DATABASE_URL=postgresql://user:pass@localhost:5432/vendai python db/seed.py
```

| Tabel | Diisi oleh |
|---|---|
| `vendors`, `vendor_items`, `model_versions`, `ranking_configs`, `vendor_risk_scores` | `db/seed.py` (dari hasil notebook) |
| `users`, `recommendation_requests`, `recommendation_results`, `ai_explanations`, `procurement_orders`, `vendor_performance_log` | Aplikasi saat dipakai (awalnya kosong) |

## 4. Konfigurasi Environment API (`api_key.env`)

Buat file `api_key.env` di root proyek (sudah di-ignore oleh pola `*.env`):

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/vendai
GEMINI_API_KEY=isi_api_key_anda
# opsional, default: gemini-3.8-flash
GEMINI_MODEL=gemini-3.8-flash
```

`DATABASE_URL` dibaca oleh `app/db.py`, `GEMINI_*` oleh `app/services/gen_ai.py`. Jangan commit file ini ke repository.

## 5. Menjalankan API (FastAPI)

Jalankan dari **root proyek** (agar import `app.*` terbaca):

```bash
uvicorn app.main:app --reload
```

- Server: `http://127.0.0.1:8000`
- Dokumentasi interaktif (Swagger): `http://127.0.0.1:8000/docs`

### Endpoint

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/health` | Cek server berjalan |
| `GET` | `/categories` | Daftar kategori utama, sub-kategori, dan satuan (dari DB) |
| `GET` | `/vendors` | Direktori vendor × item dari DB (filter, pencarian, sort, paginasi) |
| `POST` | `/recommend` | Ranking vendor sesuai kebutuhan (logika `rank_vendors` notebook 06, dijalankan di SQL) |
| `POST` | `/risk_analysis` | Menilai risiko satu vendor → `Risk_Score` dan `Risk_Tier` |
| `POST` | `/generate_explanation` | Penjelasan hasil rekomendasi/ranking dalam bahasa Indonesia (Gemini) |

### `GET /vendors`

Query: `main_category` (opsional), `q` (cari `supplier_id`/`item_description`), `sort` = `score` (risiko terendah) / `price` / `lead_time`, `limit` (maks 200, default 50), `offset`.

Bentuk response (nilai item hanya ilustrasi):

```json
{
  "total": 36065,
  "items": [
    {
      "item_id": 1, "supplier_id": "SUP_00001", "vendor_type": "Produsen/Pabrik",
      "main_category": "Kustomisasi & Produksi", "sub_category": "Produksi Handuk Custom",
      "item_description": "...", "unit": "pcs", "unit_price_idr": 12500, "moq": 100,
      "capacity_per_week": 800, "lead_time_days": 3, "on_time_delivery_rate": 92,
      "defect_rate": 1.2, "risk_score": 0.05, "risk_tier": "Rendah", "kriteria_teknis_gagal": []
    }
  ]
}
```

### `POST /recommend`

```json
{
  "main_category": "Kustomisasi & Produksi",
  "sub_category": "Produksi Handuk Custom",
  "quantity": 300,
  "budget": 12000000,
  "deadline_days": 21,
  "vendor_type": null,
  "top_k": 5
}
```

Response: daftar item seperti `GET /vendors`, ditambah `rank`, `total_price`, dan `score`, diurutkan dari skor tertinggi. Aturan filter dan skor dijelaskan di [Ranking Vendor](#ranking-vendor); bobot dan tier yang dikecualikan dibaca dari `ranking_configs` yang aktif.

### `POST /risk_analysis`

Request: 8 fitur vendor. Semua field boleh `null` (diimputasi median data train). Field di luar 8 fitur ini **ditolak** (`extra="forbid"`).

```json
{
  "Financial_Stability_Score": 72.5,
  "On_Time_Delivery_Rate": 88,
  "Defect_Rate": 1.8,
  "Lead_Time_Days": 6,
  "Alternative_Suppliers_Available": 3,
  "Contract_Length_Months": 24,
  "Environmental_Compliance": 80,
  "Previous_Disruptions": 1
}
```

| Field | Rentang valid |
|---|---|
| `Financial_Stability_Score`, `On_Time_Delivery_Rate`, `Environmental_Compliance` | 0–100 |
| `Defect_Rate`, `Alternative_Suppliers_Available`, `Previous_Disruptions` | 0–10 |
| `Lead_Time_Days` | ≥ 1 (skala 3–30 hari) |
| `Contract_Length_Months` | ≥ 0 |

Response:

```json
{
  "Risk_Score": 0.0133,
  "Operasional_Buruk": false,
  "Teknis_Buruk": false,
  "Kriteria_Teknis_Gagal": "",
  "Risk_Tier": "Rendah"
}
```

Arti setiap field dijelaskan di [Output per vendor](#output-per-vendor).

### `POST /generate_explanation`

Request: daftar vendor hasil ranking (minimal 1) dan pertanyaan opsional. Model diinstruksikan untuk tidak menghitung ulang skor atau mengubah urutan ranking.

```json
{
  "supplier": [
    {
      "Supplier_ID": "SUP_02808",
      "Rank": 1,
      "Risk_Score": 0.05,
      "Attributes": {"Unit_Price_IDR": 12500, "Lead_Time_Days": 3, "Risk_Tier": "Rendah"}
    }
  ],
  "question": "Kenapa vendor ini direkomendasikan?"
}
```

Response:

```json
{ "explanation": "Ringkasan rekomendasi: ...", "model": "gemini-3.8-flash" }
```

### Penanganan Error

| Status | Kondisi |
|---|---|
| `422` | Body tidak valid: tipe salah, nilai di luar rentang, ada field tambahan, atau `supplier` kosong |
| `503` | Database tidak dapat diakses / `DATABASE_URL` kosong, artefak model tidak ditemukan, atau Gemini tidak mengembalikan jawaban |
| `502` | Pemanggilan Gemini gagal (API key salah, kuota habis, dsb.) |

## 6. Menjalankan Frontend (React + Vite)

```bash
npm install
npm run start:dev
```

Buka `http://localhost:5173`. Jalankan API (langkah 5) bersamaan, karena frontend mengambil data dari database lewat API: Vite meneruskan request `/api/*` ke `http://127.0.0.1:8000` (`vite.config.js`), dan semua pemanggilan API ada di `src/api.js`.

| Halaman | Sumber data |
|---|---|
| Ringkasan | `GET /vendors` (total item & vendor risiko terendah) |
| Rekomendasi AI | `GET /categories` + `POST /recommend` |
| Direktori vendor | `GET /vendors` (filter, pencarian, sort, "Muat lebih banyak") |
| Perbandingan | Vendor yang dipilih dari Direktori/Rekomendasi |
| Pengadaan | Masih state lokal (belum disimpan ke DB) |

Jika API atau database tidak berjalan, frontend menampilkan peringatan "Data vendor gagal dimuat".

Build produksi: `npm run build` (output di `dist/`), pratinjau dengan `npm run preview`.

## Status Pengembangan

| Komponen | Status |
|---|---|
| Pipeline data & model (notebook 01–06) | ✅ Selesai: model, risk tier, dan ranking tervalidasi dengan `assert` |
| `app/risk_scoring.py` | ✅ Selesai, dipakai notebook 04–06 |
| Skema database & seeding (`db/`) | ✅ Selesai |
| API `/health` | ✅ Berjalan |
| API `/generate_explanation` | ✅ Terhubung ke Gemini (butuh `api_key.env`) |
| API `/risk_analysis` (`app/services/rank_load.py`) | ⚠️ Belum tersambung ke artefak model, lihat catatan di bawah |
| API `/categories`, `/vendors`, `/recommend` (`app/db.py`) | ✅ Membaca database PostgreSQL |
| Frontend ↔ API | ✅ Ringkasan, Rekomendasi, Direktori, Perbandingan memakai data DB |
| Halaman Pengadaan | ⏳ Masih state lokal; perlu tabel `users` terisi (login) untuk disimpan ke `procurement_orders` |
| Kartu metrik dummy di Ringkasan | ⏳ "Rekomendasi tersedia" dan "Potensi penghematan" masih angka contoh |

Hal yang perlu diperbaiki di `app/` agar `/risk_analysis` berjalan:

- `rank_load.py` memuat `models/risk_model.pkl`, sedangkan artefak ada di `models/v1/vendai_model.pkl` (disimpan dengan `joblib`).
- `rank_load.py` membaca key `rank_tier_config`, padahal key di artefak adalah `risk_tier_config`.
- `assign_risk_tier` dipanggil dengan urutan argumen `(df, pipeline, config)`, padahal signature-nya `(pipeline, df, config)`.
- Nama key response (`Operational_buruk`, `Teknis_buruk`) berbeda dengan output `assign_risk_tier` dan `RiskResponse` (`Operasional_Buruk`, `Teknis_Buruk`).
- `main.py` memakai `status.HTTP_442_UNPROCESSABLE_ENTITY` (tidak ada); seharusnya `HTTP_422_UNPROCESSABLE_ENTITY`.

---

# Bagian 2 — Penjelasan Proyek

## Gambaran Alur Sistem

```mermaid
flowchart LR
    A[data/raw<br>souvenir_vendor_dataset.csv] --> B[01 EDA &<br>Data Quality]
    B -->|supplier_clean.csv| C[02 Feature<br>Engineering]
    C -->|X/y train & test| D[03 Modelling]
    D -->|model_pipeline.pkl| E[04 Risk Scoring]
    E -->|risk_tier_config.json| F[05 Save Model]
    D -->|model_pipeline.pkl| F
    F -->|vendai_model.pkl| R[06 Ranking]
    B -->|vendor_catalog.csv| R
    R -->|vendor_catalog_scored.csv<br>ranking_config.json| G[app/ API<br>sistem rekomendasi]
    F -->|vendai_model.pkl| G
    H[app/risk_scoring.py] -.dipakai oleh.-> E
    H -.dipakai oleh.-> F
    H -.dipakai oleh.-> R
    H -.dipakai oleh.-> G
```

Secara ringkas:

1. Data supplier dibersihkan (duplikat dihapus, missing value dipertahankan untuk diimputasi nanti) dan dipecah menjadi data level vendor (untuk model) dan katalog vendor × item (untuk ranking).
2. Data dibagi menjadi train dan test secara stratified.
3. Model klasifikasi dilatih di dalam satu `Pipeline` scikit-learn (imputasi → scaling → model) untuk memprediksi `Risk_Level`.
4. Probabilitas dari model digabung dengan aturan teknis untuk menentukan Risk Tier.
5. Model, konfigurasi aturan, dan metadata dikemas dalam satu artefak yang siap dimuat oleh API.
6. Katalog vendor difilter sesuai kebutuhan user dan diurutkan berdasarkan skor risiko, harga, dan lead time.

---

## Struktur Proyek

```
Capstone-Project---VendAI/
├── app/
│   ├── main.py              # FastAPI: /health, /categories, /vendors, /recommend, /risk_analysis, /generate_explanation
│   ├── schemas.py           # Skema request/response API (Pydantic)
│   ├── risk_scoring.py      # Logika penentuan Risk Tier (dipakai notebook & API)
│   ├── db.py                # Koneksi PostgreSQL (DATABASE_URL)
│   └── services/
│       ├── rank_load.py     # Memuat artefak model & prediksi risiko vendor
│       └── gen_ai.py        # Penjelasan rekomendasi via Gemini (google-genai)
├── db/
│   ├── schema.sql           # Skema PostgreSQL (vendor, katalog, model, rekomendasi, order)
│   └── seed.py              # Mengisi tabel referensi dari hasil notebook
├── src/                     # Frontend React (Vite + Bootstrap)
│   ├── App.jsx
│   ├── api.js               # Pemanggilan API + mapping data DB ke komponen
│   ├── components/          # Metric, Money, PageHeader, StatusBadge, VendorLogo
│   └── pages/               # Overview, Vendors, Recommendations, Compare, Procurement
├── index.html               # Entry point Vite
├── vite.config.js           # Proxy /api → FastAPI
├── package.json             # Dependency frontend
├── api_key.env              # DATABASE_URL & GEMINI_API_KEY (dibuat sendiri, di-ignore git)
├── data/
│   ├── raw/
│   │   ├── supplier_risk_dataset.csv    # Dataset asli (generik)
│   │   └── souvenir_vendor_dataset.csv  # Dataset souvenir/hampers (dataset raw, sintetis)
│   └── processed/           # Output notebook 01 & 02 (di-ignore git)
├── models/
│   └── v1/                  # Artefak notebook 03–06 (di-ignore git)
│       ├── model_pipeline.pkl      # Pipeline terlatih (notebook 03)
│       ├── risk_tier_config.json   # Aturan Risk Tier (notebook 04)
│       ├── vendai_model.pkl        # Artefak final untuk deploy (notebook 05)
│       ├── vendor_catalog_scored.csv  # Katalog vendor × item + risk tier (notebook 06)
│       └── ranking_config.json     # Bobot skor ranking (notebook 06)
├── notebooks/
│   ├── 01_eda_data_quality.ipynb
│   ├── 02_feature_engineering.ipynb
│   ├── 03_modelling.ipynb
│   ├── 04_risk_scoring.ipynb
│   ├── 05_save_model.ipynb
│   └── 06_ranking.ipynb
└── requirements.txt
```

---

## Dataset

Sumber asli: `data/raw/supplier_risk_dataset.csv` (27.388 baris, 11 kolom, 24.112 `Supplier_ID` unik). Dataset ini generik (supply chain global), sehingga dijadikan dasar untuk **`data/raw/souvenir_vendor_dataset.csv`**, yaitu dataset raw yang menjadi input notebook 01: 40.911 baris, 19 kolom, 24.112 `Supplier_ID` unik, dan 36.065 pasangan vendor × item unik.

Format dataset baru adalah **long**: 1 baris = 1 vendor × 1 item (sub-kategori). Vendor yang menyediakan 2 item muncul di 2 baris dengan metrik vendor yang sama.

### Fitur vendor (model risiko)

| Kolom | Keterangan | Peran di sistem |
|---|---|---|
| `Supplier_ID` | Pengenal vendor | Disimpan terpisah untuk memetakan hasil, **bukan fitur** |
| `Financial_Stability_Score` | Skor stabilitas keuangan (0–100) | Fitur model |
| `Alternative_Suppliers_Available` | Jumlah pemasok cadangan (kain, benang, bahan kemasan) milik vendor (0–5) | Fitur model |
| `Environmental_Compliance` | Skor kepatuhan standar bahan & produksi (0–100) | Fitur model |
| `Contract_Length_Months` | Lama kerja sama dengan toko (bulan) | Fitur model |
| `On_Time_Delivery_Rate` | Persentase pengiriman tepat waktu (50–100) | Fitur model + aturan teknis |
| `Defect_Rate` | Persentase produk cacat/reject (0–10) | Fitur model + aturan teknis |
| `Lead_Time_Days` | Waktu tunggu pesanan (**3–30 hari**, di-rescale linear dari 7–120 hari) | Fitur model + aturan teknis + filter ranking |
| `Previous_Disruptions` | Jumlah gangguan sebelumnya (0–5) | Fitur model + aturan teknis |
| `Risk_Level` | Target: `1` = berisiko, `0` = tidak berisiko | Label |

`Geopolitical_Risk_Index` **tidak ada** di dataset raw (dibuang saat penyusunan dataset) karena vendor souvenir berasal dari dalam negeri dan sebelumnya juga tidak dipakai model.

### Fitur item (filtering & ranking, **tidak masuk model**)

| Kolom | Keterangan |
|---|---|
| `Vendor_Type` | Produsen/Pabrik, Konveksi UMKM, Home Industry, Distributor/Grosir, Supplier Packaging (1 tipe per vendor) |
| `Main_Category` | Kategori utama: Bahan Baku / Kustomisasi & Produksi / Packaging |
| `Sub_Category` | Produk/jasa yang disediakan vendor (lihat tabel di bawah) |
| `Item_Description` | Deskripsi item, contoh: "Produksi handuk 30x70 cm dengan bordir nama pengantin" |
| `Unit` | Satuan harga & kapasitas: `pcs` / `kg` / `meter` |
| `Unit_Price_IDR` | Harga per satuan (Rupiah) |
| `MOQ` | Minimum Order Quantity (dalam `Unit`) |
| `Production_Capacity` + `Capacity_Period` | Kapasitas produksi/suplai, tercatat per `Minggu` atau per `Bulan`. Dinormalisasi di notebook 01 menjadi `Capacity_Per_Week` dan `Capacity_Per_Month` |

| Main_Category | Sub_Category (satuan, kisaran harga) |
|---|---|
| Bahan Baku | Kain Terry/Handuk (kg, 60–120rb) · Kain Beludru Sajadah (meter, 25–60rb) · Kain Katun Combed (kg, 110–160rb) · Kain Sarung Bantal/Kanvas (meter, 20–50rb) · Dakron/Isi Bantal (kg, 30–55rb) |
| Kustomisasi & Produksi | Produksi Handuk Custom (pcs, 12–45rb) · Produksi Sajadah Custom (pcs, 30–110rb) · Sablon/DTF T-Shirt (pcs, 35–95rb) · Jahit Bantal Custom (pcs, 25–80rb) · Bordir Nama/Logo (pcs, 3–12rb) · Printing Sublim (pcs, 5–20rb) |
| Packaging | Box Hampers (pcs, 8–35rb) · Pouch/Tas Spunbond (pcs, 2–8rb) · Plastik OPP/Mika (pcs, 300–2.000) · Kartu Ucapan & Label (pcs, 500–3.000) · Pita & Aksesori (pcs, 500–2.500) |

> Fitur item dibuat **sintetis** dan **tidak dikaitkan dengan `Risk_Level`**. Karena itu fitur ini tidak dimasukkan ke model risiko (hanya akan menambah noise), dan hanya dipakai untuk filtering & ranking.

### Asal dataset

Dataset raw disusun dari `supplier_risk_dataset.csv` dengan aturan berikut:

1. Setiap `Supplier_ID` unik diberi satu `Vendor_Type`. Tipe vendor menentukan peluang kategori utama, misalnya konveksi → Kustomisasi & Produksi dan distributor → Bahan Baku/Packaging.
2. Setiap vendor mendapat 1–3 item (bobot 60/30/10%), mayoritas dalam kategori utama yang sama.
3. Harga diambil dari kisaran sub-kategori, sedikit lebih mahal untuk vendor berkualitas (On_Time tinggi, Defect rendah). Kapasitas lebih besar untuk vendor yang finansialnya kuat dan bertipe pabrik/distributor. MOQ dijamin ≤ kapasitas per minggu.
4. `Lead_Time_Days` di-rescale linear `3 + (x − 7) × 27/113`. Transformasinya monoton, sehingga kemampuan model tidak berubah.
5. Item digabung ke **semua baris** data asli, sehingga duplikat `Supplier_ID` tetap ada dan ditangani di notebook 01.

---

## Cara Kerja per Tahap

### 01 — EDA & Data Quality (`01_eda_data_quality.ipynb`)

| Pemeriksaan | Temuan | Keputusan |
|---|---|---|
| Format long | 40.911 baris = 36.065 pasangan vendor × item | Kolom item dibuang sebelum dedup vendor. Model tidak dilatih di format long (vendor yang sama bisa masuk train & test → leakage) |
| Duplikasi | Hanya 24.112 `Supplier_ID` unik | Satu baris per ID (`groupby('Supplier_ID').first()`) → 24.112 baris |
| Missing value | < 1,5% per kolom | Tidak di-drop (akan membuang ~7% baris). Diimputasi median **setelah split** |
| Outlier | Nilai ekstrem masih dalam rentang wajar | Dibiarkan |
| Distribusi target | 70% `Risk_Level = 1`, 30% `= 0` | Gunakan `stratify`, `class_weight='balanced'`, metrik F1 dan ROC-AUC |
| Korelasi dengan target | `Financial_Stability_Score` −0,51, `Alternative_Suppliers_Available` −0,25, `Environmental_Compliance` −0,23 | Korelasi antar fitur sangat rendah (maks 0,04), jadi tidak ada multikolinearitas |
| Fitur item | Harga antar sub-kategori berbeda jauh dan satuannya berbeda (pcs/kg/meter); kapasitas tercatat campuran per minggu/bulan | Harga hanya dibandingkan dalam sub-kategori yang sama; kapasitas dinormalisasi ke `Capacity_Per_Week` & `Capacity_Per_Month` (1 bulan = 4 minggu) |

Output:
- `data/processed/supplier_clean.csv`: level vendor, untuk model (notebook 02–05).
- `data/processed/vendor_catalog.csv`: level vendor × item dengan kapasitas yang sudah dinormalisasi, untuk ranking (notebook 06).

### 02 — Feature Engineering (`02_feature_engineering.ipynb`)

- `Supplier_ID` disisihkan sebagai `ids`, dan `Risk_Level` dikeluarkan dari fitur.
- Train-test split 80/20 dengan `stratify=y` dan `random_state=42` → **19.289 baris train** dan **4.823 baris test**, proporsi 70/30 terjaga.
- `ids` ikut di-split dengan urutan acak yang sama, sehingga `id_test` tetap sejajar dengan `X_test`.
- Data disimpan **mentah** (masih ada NaN, belum di-scale). Imputasi dan scaling sengaja dilakukan di dalam pipeline model agar:
  - statistik preprocessing hanya dihitung dari data train (tanpa data leakage), dan
  - preprocessing yang sama otomatis diterapkan pada data vendor baru saat deploy.

Output: `X_train.csv`, `X_test.csv`, `y_train.csv`, `y_test.csv`, dan `id_test.csv` di `data/processed/`.

### 03 — Modelling (`03_modelling.ipynb`)

**Pipeline**

```
SimpleImputer(strategy='median') → StandardScaler() → Model
```

**Perbandingan model** (5-fold `StratifiedKFold`, data train saja):

| Model | F1 | ROC-AUC |
|---|---|---|
| HistGradientBoosting | 0,890 | **0,933** |
| RandomForest | **0,896** | 0,930 |
| LogisticRegression | 0,877 | 0,922 |

Semua model memakai `class_weight='balanced'`. **HistGradientBoosting** dipilih karena ROC-AUC-nya tertinggi. ROC-AUC paling relevan karena sistem mengurutkan vendor berdasarkan probabilitas risiko.

**Tuning** dengan `GridSearchCV` (108 kombinasi, scoring ROC-AUC). Parameter terbaik: `learning_rate=0.05`, `max_iter=300`, `max_leaf_nodes=10`, `min_samples_leaf=20`, dengan ROC-AUC CV 0,935.

**Evaluasi**

| Data | ROC-AUC | F1 (kelas 1) | Precision / Recall kelas 0 | Precision / Recall kelas 1 |
|---|---|---|---|---|
| Train | 0,948 | 0,90 | 0,73 / 0,89 | 0,95 / 0,86 |
| Test | **0,934** | **0,89** | 0,72 / 0,87 | 0,94 / 0,85 |

Selisih train dan test kecil, dan skor test hampir sama dengan skor CV, jadi model tidak overfit.

**Fitur paling berpengaruh** (permutation importance pada data test, penurunan ROC-AUC):

| Fitur | Importance |
|---|---|
| Financial_Stability_Score | 0,283 |
| Alternative_Suppliers_Available | 0,095 |
| Environmental_Compliance | 0,077 |
| Contract_Length_Months | 0,020 |
| Previous_Disruptions | 0,016 |
| On_Time_Delivery_Rate | 0,007 |
| Defect_Rate | 0,001 |
| Lead_Time_Days | 0,001 |

Model hampir sepenuhnya bertumpu pada faktor keuangan dan rantai pasok. Metrik teknis (`Defect_Rate`, `Lead_Time_Days`, dan lainnya) nyaris tidak dipakai model, karena di dataset ini label `Risk_Level` tidak ditentukan oleh metrik tersebut. Metrik teknis tetap dipertahankan sebagai fitur, dan pengaruhnya pada rekomendasi diberikan lewat **aturan teknis** di tahap 04.

Output: `models/v1/model_pipeline.pkl`.

### 04 — Risk Scoring (`04_risk_scoring.ipynb`)

Menentukan Risk Tier dari prediksi model dan aturan teknis. Logikanya ada di `app/risk_scoring.py` (lihat [Penentuan Risk Tier](#penentuan-risk-tier)).

Output: `models/v1/risk_tier_config.json`.

### 05 — Save Model (`05_save_model.ipynb`)

1. Memuat pipeline (notebook 03) dan konfigurasi tier (notebook 04).
2. Menghitung metrik final di data test: ROC-AUC 0,934, F1 0,892.
3. Mengemas semuanya ke `models/v1/vendai_model.pkl`.
4. **Verifikasi**: artefak dimuat ulang dari file, lalu dipastikan dengan `assert` bahwa prediksinya identik dengan pipeline asli.
5. **Simulasi vendor baru**: tiga vendor fiktif dengan data mentah, nilai kosong, dan kolom tambahan (lead time dalam skala 3–30 hari). Hasilnya dipastikan dengan `assert` sesuai kriteria tier: Rendah, Sedang, Tinggi.

### 06 — Ranking (`06_ranking.ipynb`)

1. Risk tier dihitung **sekali per vendor** (batch) dengan `assign_risk_tier`, lalu di-join ke `vendor_catalog.csv`. `Lead_Time_Days` yang kosong diisi median train.
2. Fungsi `rank_vendors(catalog, main_category, sub_category, quantity, budget, deadline_days=None, vendor_type=None, top_k=5)` memfilter lalu mengurutkan vendor (lihat [Ranking Vendor](#ranking-vendor)).
3. Simulasi 3 kebutuhan toko (produksi handuk 300 pcs, kain katun combed 50 kg, box hampers 500 pcs) dan 1 skenario filter `Vendor_Type`. Setiap hasil dicek dengan `assert`: tidak kosong, memenuhi semua filter, dan terurut menurun berdasarkan skor.

Output: `models/v1/vendor_catalog_scored.csv` dan `models/v1/ranking_config.json`.

---

## Penentuan Risk Tier

Fungsi: `assign_risk_tier(pipeline, df, config)` di `app/risk_scoring.py`.

### Dua faktor penilaian

**Faktor operasional (dari model)**
`Risk_Score = predict_proba(...)[:, 1]`. Faktor ini dinilai **kurang baik** jika `Risk_Score ≥ operational_threshold` (0,5).

**Faktor teknis (dari aturan)**
Faktor ini dinilai **kurang baik** jika vendor gagal minimal `min_tech_fails` (2) dari kriteria berikut:

| Kriteria | Gagal jika |
|---|---|
| `On_Time_Delivery_Rate` | < 80 |
| `Defect_Rate` | > 3,5 |
| `Lead_Time_Days` | > 10 (skala 3–30 hari; setara > 35 pada skala lama) |
| `Previous_Disruptions` | ≥ 2 |

Nilai kosong pada metrik teknis diisi dengan median data train (`tech_medians`). Batas kriteria diambil dari kisaran kuartil data train sebagai titik awal, dan dapat disesuaikan dengan standar bisnis lewat `risk_tier_config.json` tanpa mengubah kode.

### Matriks tier

| | Teknis baik | Teknis kurang baik |
|---|---|---|
| **Operasional baik** | Rendah | Sedang |
| **Operasional kurang baik** | Sedang | Tinggi |

Implementasinya: jumlah faktor yang kurang baik (0, 1, atau 2) dipetakan ke Rendah, Sedang, atau Tinggi.

### Output per vendor

| Kolom | Isi |
|---|---|
| `Risk_Score` | Probabilitas risiko dari model (0–1) |
| `Operasional_Buruk` | `True` jika faktor operasional kurang baik |
| `Teknis_Buruk` | `True` jika faktor teknis kurang baik |
| `Kriteria_Teknis_Gagal` | Daftar kriteria teknis yang gagal, untuk menjelaskan rekomendasi |
| `Risk_Tier` | `Rendah` / `Sedang` / `Tinggi` (kategori berurutan) |

### Hasil pada data test

| Risk Tier | Proporsi vendor | Vendor yang sebenarnya `Risk_Level = 1` |
|---|---|---|
| Rendah | 26,4% | 28,2% |
| Sedang | 51,3% | 80,7% |
| Tinggi | 22,4% | 94,8% |

Semakin tinggi tier, semakin besar porsi vendor yang benar-benar berisiko, jadi pembagian tier konsisten dengan label asli.

Kriteria teknis yang paling sering gagal: `Lead_Time_Days` (32,5%), `On_Time_Delivery_Rate` (31,9%), `Previous_Disruptions` (27,6%), dan `Defect_Rate` (22,1%).

---

## Ranking Vendor

Didefinisikan di `notebooks/06_ranking.ipynb`, dan logika yang sama dijalankan sebagai SQL oleh endpoint `POST /recommend` (`app/main.py`) di atas data database. Input berasal dari user website: kategori utama, sub-kategori, jumlah pesanan (`quantity`, dalam `Unit` item), budget total, sisa hari menuju acara (`deadline_days`), dan tipe vendor (opsional).

### Filter

| Kriteria | Aturan |
|---|---|
| Kategori | `Main_Category` dan `Sub_Category` sesuai pilihan; `Vendor_Type` opsional |
| MOQ | `MOQ ≤ quantity` |
| Budget | `Unit_Price_IDR × quantity ≤ budget` |
| Waktu | `Lead_Time_Days ≤ deadline_days` |
| Kapasitas | `quantity ≤ Capacity_Per_Week × (deadline_days − Lead_Time_Days) / 7`. Lead time dianggap waktu antre + kirim, dan sisa waktunya dipakai untuk produksi. Tanpa deadline: `quantity ≤ Capacity_Per_Month` |
| Risiko | `Risk_Tier` bukan `Tinggi` |

### Skor

```
Score = 0.5 × (1 − Risk_Score) + 0.3 × skor_harga + 0.2 × skor_lead_time
```

`skor_harga` dan `skor_lead_time` adalah min-max terbalik di antara kandidat yang lolos filter (termurah/tercepat = 1). Dengan begitu harga hanya dibandingkan dalam sub-kategori yang sama, sehingga perbedaan satuan tidak jadi masalah. Bobot dan tier yang dikecualikan disimpan di `ranking_config.json`.

### Output per vendor

`Rank`, `Supplier_ID`, `Vendor_Type`, `Item_Description`, `Unit`, `Unit_Price_IDR`, `MOQ`, `Total_Price`, `Lead_Time_Days`, `Capacity_Per_Week`, `Risk_Score`, `Risk_Tier`, `Kriteria_Teknis_Gagal`, `Score`. Kolom `Item_Description` dan `Kriteria_Teknis_Gagal` dapat dipakai sebagai konteks penjelasan oleh endpoint gen-AI.

Contoh: **produksi handuk custom 300 pcs, budget Rp12 juta, acara 21 hari lagi** → peringkat 1 adalah vendor Produsen/Pabrik dengan harga Rp12.500/pcs (total Rp3,75 juta), lead time 3 hari, Risk_Tier Rendah, dan skor 0,956.

---

## Artefak Model

`models/v1/vendai_model.pkl` adalah dictionary yang disimpan dengan `joblib`:

```python
{
    'pipeline': Pipeline(imputer → scaler → HistGradientBoostingClassifier),
    'risk_tier_config': {
        'operational_threshold': 0.5,
        'min_tech_fails': 2,
        'tech_rules': {...},     # kriteria teknis
        'tech_medians': {...},   # median data train untuk metrik teknis
    },
    'metadata': {
        'features': [...],       # 8 fitur, urutan sesuai saat training
        'model': 'HistGradientBoostingClassifier',
        'metrics_test': {'roc_auc': 0.934, 'f1': 0.8916},
        'sklearn_version': '1.7.0',
        'python_version': '3.11.16',
        'created': '2026-11-17',
    },
}
```

File `.pkl` hanya dapat dimuat dengan versi scikit-learn yang kompatibel. Gunakan versi yang tercatat di `metadata['sklearn_version']` (sudah di-pin di `requirements.txt`).

---

## Alur Inferensi untuk Vendor Baru

```python
import joblib
from app.risk_scoring import assign_risk_tier

bundle = joblib.load('models/v1/vendai_model.pkl')

hasil = assign_risk_tier(bundle['pipeline'], vendor_df, bundle['risk_tier_config'])
hasil.insert(0, 'Supplier_ID', vendor_df['Supplier_ID'])
```

Syarat data `vendor_df`:

- Harus memiliki 8 kolom fitur pada `bundle['metadata']['features']`. Urutan kolom bebas, karena fungsi memilih kolom berdasarkan nama.
- Data dikirim **mentah**. Nilai kosong (`NaN`/`None`) diperbolehkan dan diisi otomatis oleh pipeline (median data train).
- Kolom tambahan, seperti `Supplier_ID` atau nama vendor, diabaikan oleh model.

---

## Keterbatasan dan Catatan

- **Definisi risiko mengikuti dataset.** Label `Risk_Level` terutama mencerminkan risiko keuangan dan rantai pasok, bukan kualitas operasional. Karena itu metrik teknis dinilai lewat aturan bisnis, bukan oleh model.
- **`Geopolitical_Risk_Index` dibuang**, padahal korelasinya dengan target termasuk yang tertinggi (+0,30). Alasan: vendor souvenir/hampers berasal dari dalam negeri.
- **Fitur item bersifat sintetis.** Tipe vendor, kategori, harga, MOQ, dan kapasitas dibuat sintetis saat penyusunan dataset agar sistem ranking bisa didemokan. Sebelum dipakai nyata, ganti dengan data katalog vendor asli dengan format kolom yang sama.
- **Ranking per item.** Satu query merekomendasikan vendor untuk satu sub-kategori. Kebutuhan satu paket hampers (misalnya handuk + box + kartu ucapan) dilakukan dengan beberapa query.
- **Proporsi tier Rendah terbatas.** Sekitar 64% vendor test dinilai operasionalnya kurang baik, karena 70% data berlabel berisiko. `operational_threshold` dapat dinaikkan jika tier Rendah dirasa terlalu sedikit.
