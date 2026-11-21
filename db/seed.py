"""Isi tabel referensi VendAI dari data hasil pipeline notebook 01-06.

Prasyarat: db/schema.sql sudah dijalankan, notebook 01 & 06 sudah dijalankan
(data/processed/supplier_clean.csv dan models/v1/*), dan `pip install "psycopg[binary]" pandas`.

    DATABASE_URL=postgresql://user:pass@localhost:5432/vendai python db/seed.py

Yang diisi : vendors, vendor_items, model_versions, ranking_configs, vendor_risk_scores.
Dibiarkan kosong (diisi aplikasi saat dipakai): users, recommendation_*, ai_explanations,
procurement_orders, vendor_performance_log.
"""
import io
import json
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg

ROOT = Path(__file__).resolve().parents[1]
DSN = os.getenv("DATABASE_URL") or sys.exit(
    "Set DATABASE_URL dulu, mis. DATABASE_URL=postgresql://user:pass@localhost:5432/vendai")

# --- baca sumber ---
clean = pd.read_csv(ROOT / "data/processed/supplier_clean.csv")
raw = pd.read_csv(ROOT / "data/raw/souvenir_vendor_dataset.csv")
scored = pd.read_csv(ROOT / "models/v1/vendor_catalog_scored.csv")
tier_cfg = json.loads((ROOT / "models/v1/risk_tier_config.json").read_text())
rank_cfg = json.loads((ROOT / "models/v1/ranking_config.json").read_text())

# vendors: metrik dari supplier_clean (NaN tetap NULL), Vendor_Type dari katalog
vtype = scored.drop_duplicates("Supplier_ID").set_index("Supplier_ID")["Vendor_Type"]
vendors = clean.drop(columns="Risk_Level")
vendors.insert(1, "Vendor_Type", vendors["Supplier_ID"].map(vtype))
assert vendors["Vendor_Type"].notna().all(), "ada vendor tanpa Vendor_Type di katalog"
for c in ["Alternative_Suppliers_Available", "Contract_Length_Months", "Previous_Disruptions"]:
    vendors[c] = vendors[c].astype("Int64")

# vendor_items: dari dataset raw (punya kapasitas + periode asli), 1 baris per vendor x sub-kategori
items = raw.drop_duplicates(["Supplier_ID", "Sub_Category"])[
    ["Supplier_ID", "Main_Category", "Sub_Category", "Item_Description", "Unit",
     "Unit_Price_IDR", "MOQ", "Production_Capacity", "Capacity_Period"]]
assert len(items) == len(scored), "jumlah item raw != katalog ter-skor"

# vendor_risk_scores: 1 baris per vendor
risk = scored.drop_duplicates("Supplier_ID")[
    ["Supplier_ID", "Risk_Score", "Operasional_Buruk", "Teknis_Buruk",
     "Kriteria_Teknis_Gagal", "Risk_Tier"]].copy()
risk["Kriteria_Teknis_Gagal"] = risk["Kriteria_Teknis_Gagal"].map(
    lambda s: json.dumps([] if pd.isna(s) else [x.strip() for x in s.split(",")]))


def copy(cur, table, df, cols):
    buf = io.StringIO()
    df.to_csv(buf, index=False, header=False)
    with cur.copy(f"COPY {table} ({', '.join(cols)}) FROM STDIN WITH (FORMAT csv)") as cp:
        cp.write(buf.getvalue())
    print(f"{table}: {len(df)} baris")


with psycopg.connect(DSN) as conn, conn.cursor() as cur:
    cur.execute("SELECT count(*) FROM vendors")
    if cur.fetchone()[0]:
        sys.exit("Tabel vendors sudah berisi data; kosongkan dulu bila ingin seed ulang.")

    copy(cur, "vendors", vendors, [
        "supplier_id", "vendor_type", "financial_stability_score", "on_time_delivery_rate",
        "defect_rate", "lead_time_days", "alternative_suppliers_available",
        "contract_length_months", "environmental_compliance", "previous_disruptions"])
    copy(cur, "vendor_items", items, [
        "supplier_id", "main_category", "sub_category", "item_description", "unit",
        "unit_price_idr", "moq", "production_capacity", "capacity_period"])

    # model v1: metrik dari README / notebook 05 (artefak .pkl butuh versi sklearn yang sama untuk dibaca)
    cur.execute(
        """INSERT INTO model_versions (version, model_name, roc_auc, f1, sklearn_version, artifact_path)
           VALUES ('v1', 'HistGradientBoostingClassifier', 0.9345, 0.8934, '1.7.0',
                   'models/v1/vendai_model.pkl') RETURNING model_version_id""")
    mv = cur.fetchone()[0]

    cur.execute(
        """INSERT INTO ranking_configs
           (model_version_id, operational_threshold, min_tech_fails, tech_rules, tech_medians,
            weight_risk, weight_price, weight_lead_time, excluded_tiers, is_active)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::risk_tier[], TRUE)""",
        (mv, tier_cfg["operational_threshold"], tier_cfg["min_tech_fails"],
         json.dumps(tier_cfg["tech_rules"]), json.dumps(tier_cfg["tech_medians"]),
         rank_cfg["weights"]["risk"], rank_cfg["weights"]["price"], rank_cfg["weights"]["lead_time"],
         rank_cfg["exclude_tiers"]))
    print("model_versions: 1 baris, ranking_configs: 1 baris")

    risk.insert(1, "model_version_id", mv)
    copy(cur, "vendor_risk_scores", risk, [
        "supplier_id", "model_version_id", "risk_score", "operasional_buruk",
        "teknis_buruk", "kriteria_teknis_gagal", "risk_tier"])
    conn.commit()
print("selesai")
