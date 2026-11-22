import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv(Path(__file__).resolve().parents[1] / "api_key.env")


def query(sql: str, params: dict | None = None) -> list[dict]:
    # ponytail: koneksi per request, pakai psycopg_pool bila trafik naik
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ConnectionError("DATABASE_URL belum di-set di api_key.env")
    with psycopg.connect(url, row_factory=dict_row) as conn:
        return conn.execute(sql, params).fetchall()
