import os
import json
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv
from google import genai
from google.genai import types

base_dir = Path(__file__).resolve().parents[2]
env_path = base_dir / "api_key.env"
load_dotenv(env_path)
model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

@lru_cache(maxsize=1)
def model_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key = api_key)

def generate_explaination(supplier_data: list[dict], question: str | None = None):
    client = model_gemini()
    system_instruction = """
    Kamu adaklah asisten AI yang membantu menjelaskan hasil analisis risiko vendor.
    
    Tugasmu adalah menjelaskan hasil rekomendasi dan ranking vendor berdasarkan data yang diberikan.
    
    Aturan:
    1. Jangan menghitung ulang skor ranking atau Risk_Score. Gunakan data yang diberikan.
    2. Jangan mengubah urutan ranking vendor. Gunakan urutan yang diberikan.
    3. Jangan Mengubah Risk_Score atau Risk_Tier. Gunakan data yang diberikan.
    4. Jangan mengarang informasi yang tidak ada dalam data. Gunakan data yang diberikan.
    5. Jelaskan alasan vendor berada di ranking tertentu berdasarkan data yang diberikan.
    6. Jelaskan kelebihan dan kekurangan vendor jika datanya tersedia.
    7. Jelaskan trade-off jika pengguna memilih vendor alternatif.
    8. Jika informasi tidak cukup, jelaskan bahwa informasi tidak cukup untuk memberikan penjelasan yang lengkap.
    9. Gunakan bahasa Indonesia yang jelas dan mudah dipahami.
    10. Jelaskan secara ringkas dan padat, tidak terlalu panjang.
    
    Format jawaban:
    - Ringkasan rekomendasi
    - Alasan ranking
    - Kelebihan dan kekurangan vendor
    - Trade-off jika memilih vendor alternatif
    - Pertimbangan sebelum mengambil keputusan"""

    prompt = f"""
    Berikut data hasil rekomendasi vendor: {json.dumps(supplier_data, indent=2, ensure_ascii=False)}

    Pertanyaan pengguna: {question or "Jelaskan hasil rekomendasi vendor berdasarkan data."}
    Berikan jawaban sesuai aturan dan format yang telah ditentukan di atas."""

    response = client.models.generate_content(
        model = model_name,
        contents = prompt,
        config = types.GenerateContentConfig(
            system_instruction = system_instruction,
            temperature = 0.3
        )
    )

    if not response.text:
        raise RuntimeError("Tidak ada jawaban yang dihasilkan oleh model.")

    return {"explanation": response.text, "model": model_name}