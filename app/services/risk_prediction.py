import joblib
import pandas as pd
from pathlib import Path
from functools import lru_cache
from app.risk_scoring import assign_risk_tier, TIERS, OPERATORS

TIERS = TIERS
OPERATORS = OPERATORS

model_path = (Path(__file__).resolve().parents[2] / "models" / "v1" / "vendai_model.pkl")

@lru_cache(maxsize=1)
def load_model():
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")
    with open(model_path, "rb") as f:
        model = joblib.load(f)
    print("Tipe objek model:", type(model))
    print("Isi model:", repr(model)[:500])

    required_key = {"pipeline", "risk_tier_config", "metadata"}

    missing_key = required_key - model.keys()
    if missing_key:
        raise KeyError(f"Struktur tidak lengkap: {missing_key}")
    
    return model

def risk_predict(data_vendor: dict):
    model = load_model()
    pipeline = model["pipeline"]
    config = model["risk_tier_config"]

    model_features = list(pipeline.feature_names_in_)
    technical_features = list(config["tech_rules"].keys())

    required_features = list(dict.fromkeys(model_features + technical_features))

    # cek input yg belum lengkap
    missing_features = set(required_features) - set(data_vendor.keys())
    if missing_features:
        raise ValueError(f"Input tidak lengkap: {sorted(missing_features)}")

    vend_id = data_vendor.get("Supplier_ID")
    df = pd.DataFrame([{feature: data_vendor[feature] for feature in required_features}])

    result = assign_risk_tier(pipeline, df, config)
    predict = result.iloc[0]

    # response JSON
    response = ({
            "Supplier_ID": data_vendor.get("Supplier_ID", None),
            "Risk_Score": predict["Risk_Score"],
            "Operasional_Buruk": predict["Operasional_Buruk"],
            "Teknis_Buruk": predict["Teknis_Buruk"],
            "Kriteria_Teknis_Gagal": predict["Kriteria_Teknis_Gagal"],
            "Risk_Tier": predict["Risk_Tier"]
        }) 

    return response