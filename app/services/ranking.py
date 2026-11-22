
import pandas as pd
from app.services.vendor_load import (load_vendor, config_ranking)

OUTPUT_COLS = [
    "Rank",
    "Supplier_ID",
    "Vendor_Type",
    "Main_Category",
    "Sub_Category",
    "Item_Description",
    "Unit",
    "Unit_Price_IDR",
    "MOQ",
    "Total_Price",
    "Lead_Time_Days",
    "Capacity_Per_Week",
    "Capacity_Per_Month",
    "Risk_Score",
    "Risk_Tier",
    "Operasional_Buruk",
    "Teknis_Buruk",
    "Kriteria_Teknis_Gagal",
    "Score",
]

def inverse_minmax(s):
    """
    Normalisasi terbalik:
    Nilai terkecil = 1
    Nilai terbesar = 0
    Jika semua nilai sama, semuanya = 1
    """

    if s.empty:
        return s.astype(float)

    span = s.max() - s.min()

    if span == 0:
        return pd.Series(1.0, index=s.index)

    return (s.max() - s) / span


def rank_vendors(
    catalog,
    main_category,
    sub_category,
    quantity,
    budget,
    deadline_days=None,
    vendor_type=None,
    top_k=5,
    config=None,
):
    
    if config is None:
        config = config_ranking()

    if top_k < 1:
        raise ValueError("top_k harus lebih besar dari 0.")

    # Filter kategori, MOQ, budget, dan risk tier
    candidates = catalog[
        (catalog["Main_Category"] == main_category) & 
        (catalog["Sub_Category"] == sub_category) & 
        (catalog["MOQ"] <= quantity) & 
        (catalog["Unit_Price_IDR"] * quantity <= budget) & 
        (~catalog["Risk_Tier"].isin(config["exclude_tiers"]))
    ].copy()

    # Filter tipe vendor jika diberikan
    if vendor_type is not None:
        candidates = candidates[candidates["Vendor_Type"] == vendor_type]

    # Filter kapasitas produksi
    if deadline_days is None:
        candidates = candidates[quantity <= candidates["Capacity_Per_Month"]]
    else:
        production_days = (deadline_days - candidates["Lead_Time_Days"])

        candidates = candidates[(production_days >= 0) & 
                                (quantity <= candidates["Capacity_Per_Week"] * 
                                 production_days / 7)]

    # Jika tidak ada kandidat yang memenuhi kriteria
    if candidates.empty:
        return pd.DataFrame(columns=OUTPUT_COLS)

    # Hitung skor ranking
    weights = config["weights"]

    candidates = candidates.assign(
        Total_Price=(candidates["Unit_Price_IDR"] * quantity),
        Score=(
            weights["risk"] * (1 - candidates["Risk_Score"]) + 
            weights["price"] * 
            inverse_minmax(candidates["Unit_Price_IDR"]) + 
            weights["lead_time"] * 
            inverse_minmax(candidates["Lead_Time_Days"])
        ),
    )

    # Urutkan berdasarkan skor tertinggi
    top = candidates.sort_values("Score", ascending=False).head(top_k).copy()

    # Tambahkan nomor ranking
    top.insert(0, "Rank", range(1, len(top) + 1))

    return top[OUTPUT_COLS].reset_index(drop=True)


def get_recommendations(
    main_category,
    sub_category,
    quantity,
    budget,
    deadline_days=None,
    vendor_type=None,
    top_k=5,
):

    catalog = load_vendor()
    config = config_ranking()

    return rank_vendors(
        catalog=catalog,
        main_category=main_category,
        sub_category=sub_category,
        quantity=quantity,
        budget=budget,
        deadline_days=deadline_days,
        vendor_type=vendor_type,
        top_k=top_k,
        config=config,
    )
