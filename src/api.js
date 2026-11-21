// Semua akses data frontend lewat FastAPI (/api diproxy oleh Vite ke app/main.py).

async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d) => d.msg).join(', ')
      : body.detail;
    throw new Error(detail || `Request gagal (${res.status})`);
  }
  return res.json();
}

const TIER_COLOR = { Rendah: 'mint', Sedang: 'orange', Tinggi: 'pink' };

// Baris DB (vendor x item) -> bentuk vendor yang dipakai komponen UI.
export function toVendor(r) {
  const words = r.vendor_type.split(/[\s/]+/);
  return {
    id: r.item_id,
    name: r.supplier_id,
    category: r.main_category,
    subCategory: r.sub_category,
    location: r.vendor_type,
    description: r.item_description,
    unit: r.unit,
    unitPrice: r.unit_price_idr,
    moq: r.moq,
    price: r.total_price ?? r.unit_price_idr,
    leadTime: r.lead_time_days,
    delivery: `${r.lead_time_days} hari`,
    onTime: r.on_time_delivery_rate ?? '-',
    quality:
      r.defect_rate == null ? 0 : Math.max(0, Math.round(100 - r.defect_rate * 10)),
    score: Math.round((r.score ?? 1 - r.risk_score) * 100),
    riskScore: r.risk_score,
    riskTier: r.risk_tier,
    rank: r.rank,
    verified: r.risk_tier === 'Rendah',
    tags: [`Risiko ${r.risk_tier}`, ...(r.kriteria_teknis_gagal || [])],
    initials: (words[0][0] + (words[1]?.[0] || '')).toUpperCase(),
    color: TIER_COLOR[r.risk_tier] || 'blue',
  };
}

export const getCategories = () => request('/categories');

export async function getVendors({ category, query, sort, offset = 0, limit = 50 }) {
  const params = new URLSearchParams({ sort, offset, limit });
  if (category && category !== 'Semua kategori') params.set('main_category', category);
  if (query) params.set('q', query);
  const data = await request(`/vendors?${params}`);
  return { total: data.total, items: data.items.map(toVendor) };
}

export async function recommend(body) {
  const rows = await request('/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return rows.map(toVendor);
}
