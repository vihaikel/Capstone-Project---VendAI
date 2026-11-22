
import json
from pathlib import Path
from functools import lru_cache
import pandas as pd


# Root directory project VendAI_API
BASE_DIR = Path(__file__).resolve().parents[2]

# Lokasi file
VENDOR_PATH = BASE_DIR / "models" / "v1" / "vendor_catalog_scored.csv"
CONFIG_PATH = BASE_DIR / "models" / "v1" / "ranking_config.json"


@lru_cache(maxsize=1)
def load_vendor():
    if not VENDOR_PATH.exists():
        raise FileNotFoundError(f"File vendor_catalog_scored.csv tidak ditemukan: {VENDOR_PATH}")

    df = pd.read_csv(VENDOR_PATH)

    if df.empty:
        raise ValueError("Data supplier kosong.")

    required_columns = {
        "Supplier_ID",
        "Vendor_Type",
        "Main_Category",
        "Sub_Category",
        "Item_Description",
        "Unit",
        "Unit_Price_IDR",
        "MOQ",
        "Capacity_Per_Week",
        "Capacity_Per_Month",
        "Lead_Time_Days",
        "Risk_Score",
        "Risk_Tier",
        "Kriteria_Teknis_Gagal",
    }

    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(f"Kolom CSV tidak ditemukan: {sorted(missing_columns)}")

    return df


@lru_cache(maxsize=1)
def config_ranking():

    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"File ranking_config.json tidak ditemukan: {CONFIG_PATH}")

    with open(CONFIG_PATH, "r", encoding="utf-8") as file:
        config = json.load(file)

    required_keys = {"weights", "exclude_tiers"}
    missing_keys = required_keys - set(config.keys())

    if missing_keys:
        raise ValueError(f"Konfigurasi ranking tidak lengkap: {sorted(missing_keys)}")

    required_weights = {"risk", "price", "lead_time"}
    missing_weights = required_weights - set(config["weights"].keys())

    if missing_weights:
        raise ValueError(f"Weight ranking tidak lengkap: {sorted(missing_weights)}")

    return config