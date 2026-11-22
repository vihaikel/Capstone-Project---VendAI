import os
import json
import logging
import time

from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

base_dir = Path(__file__).resolve().parents[2]
env_path = base_dir / "api_key.env"
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY belum dikonfigurasi")
if not model_name:
    raise RuntimeError("GEMINI_MODEL belum dikonfigurasi")

client = genai.Client(api_key = api_key)


def generate_explaination(supplier_data: list[dict], procurement_request: dict, question: str | None = None):
    system_instruction = """
    Kamu adaklah asisten AI yang membantu menjelaskan hasil analisis risiko vendor.
    
    Tugasmu adalah menjelaskan hasil rekomendasi dan ranking vendor berdasarkan data yang diberikan.
    
    Aturan:
    1. Gunakan hanya data yang diberikan.
    2. Jangan menghitung ulang score atau mengubah ranking.
    3. Jelaskan mengapa vendor di peringkat pertama menjadi rekomendasi utama.
    4. Bandingkan harga, lead time, dan risiko antar vendor. 
    5. Jelaskan trade-off jika user memilih vendor alternatif.
    6. Jangan mengarang informasi yang tidak tersedia.
    8. Gunakan bahasa Indonesia secara ringkas dan jelas.
    9. Maksimal 150 kata
    
    Format jawaban:
    - Ringkasan rekomendasi
    - Alasan ranking
    - Kelebihan dan kekurangan vendor
    - Trade-off jika memilih vendor alternatif
    - Pertimbangan sebelum mengambil keputusan"""

    prompt = f"""
    Berikut data permintaan pengadaan: {json.dumps(procurement_request, ensure_ascii=False)}

    Berikut data hasil rekomendasi vendor: {json.dumps(supplier_data, ensure_ascii=False)}

    Pertanyaan tambahan dari pengguna:
    {question or "Jelaskan rekomendasi vendor berdasarkan data yang tersedia."}"""

    start_time = time.perf_counter()
    try:
        response = client.models.generate_content(
            model = model_name,
            contents = prompt,
            config = types.GenerateContentConfig(
                system_instruction = system_instruction,
                temperature = 0.2,
                max_output_tokens = 500
            )
        )

        duration = time.perf_counter() - start_time
        logger.info("Response Gemini berhasil. Model: %s | Durasi: %.2f detik", model_name, duration)
        if not response.text:
            raise RuntimeError("Gemini tidak menghasilkan jawaban")

        return{"explaination": response.text, "model": model_name}

    except Exception:
        duration = time.perf_counter() - start_time
        logger.exception("Response Gemini gagal. Model: %s | Durasi: %.2f detik", model_name, duration)

        raise