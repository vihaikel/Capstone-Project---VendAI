"""Penentuan Risk Tier vendor dari faktor operasional (prediksi model) dan faktor teknis (aturan)."""
import operator

import pandas as pd

TIERS = ['Rendah', 'Sedang', 'Tinggi']
OPERATORS = {'<': operator.lt, '<=': operator.le, '>': operator.gt, '>=': operator.ge}


def assign_risk_tier(pipeline, df, config):
    """Kembalikan Risk_Score, status tiap faktor, kriteria teknis yang gagal, dan Risk_Tier per vendor.

    Rendah: kedua faktor baik. Sedang: salah satu kurang baik. Tinggi: keduanya kurang baik.
    """
    rules = config['tech_rules']
    tech = df[list(rules)].fillna(config['tech_medians'])
    fails = pd.DataFrame(
        {col: OPERATORS[rule['op']](tech[col], rule['value']) for col, rule in rules.items()}
    )

    risk_score = pipeline.predict_proba(df[pipeline.feature_names_in_])[:, 1]
    operasional_buruk = risk_score >= config['operational_threshold']
    teknis_buruk = (fails.sum(axis=1) >= config['min_tech_fails']).to_numpy()

    n_buruk = operasional_buruk.astype(int) + teknis_buruk.astype(int)
    return pd.DataFrame({
        'Risk_Score': risk_score,
        'Operasional_Buruk': operasional_buruk,
        'Teknis_Buruk': teknis_buruk,
        'Kriteria_Teknis_Gagal': fails.apply(lambda row: ', '.join(row.index[row]), axis=1),
        'Risk_Tier': pd.Categorical.from_codes(n_buruk, TIERS, ordered=True),
    }, index=df.index)
