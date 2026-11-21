import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import VendorLogo from '../components/VendorLogo.jsx';
import { money } from '../components/Money.jsx';
import { recommend } from '../api.js';

const PRIORITIES = [
  { label: 'Seimbang', icon: 'bi-stars', desc: 'Skor risiko, harga & lead time' },
  { label: 'Harga terendah', icon: 'bi-wallet2', desc: 'Optimalkan biaya' },
  { label: 'Kualitas', icon: 'bi-award', desc: 'Defect rate terendah' },
  { label: 'Pengiriman tercepat', icon: 'bi-truck', desc: 'Lead time terpendek' },
];

function Recommendations({
  categories,
  need,
  setNeed,
  budget,
  setBudget,
  priority,
  setPriority,
  selected,
  toggleVendor,
  setPage,
  notify,
  setDetail,
}) {
  const mainCategories = [...new Set(categories.map((c) => c.main_category))];
  const subCategories = categories.filter((c) => c.main_category === need);
  const [sub, setSub] = useState('');
  const [quantity, setQuantity] = useState('300');
  const [deadline, setDeadline] = useState('21');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pilih sub-kategori pertama saat kategori berganti / data kategori baru dimuat.
  useEffect(() => {
    if (!subCategories.some((c) => c.sub_category === sub))
      setSub(subCategories[0]?.sub_category || '');
  }, [need, categories]);

  const unit = subCategories.find((c) => c.sub_category === sub)?.unit || 'pcs';

  // Skor server = urutan "Seimbang"; prioritas lain hanya mengurutkan ulang hasil.
  const matches = [...(results || [])].sort((a, b) => {
    if (priority === 'Harga terendah') return a.price - b.price;
    if (priority === 'Kualitas') return b.quality - a.quality;
    if (priority === 'Pengiriman tercepat') return a.leadTime - b.leadTime;
    return a.rank - b.rank;
  });

  async function doSearch() {
    setLoading(true);
    try {
      const rows = await recommend({
        main_category: need,
        sub_category: sub,
        quantity: Number(quantity),
        budget: Number(budget),
        deadline_days: deadline ? Number(deadline) : null,
      });
      setResults(rows);
      notify(
        rows.length
          ? 'Rekomendasi diperbarui berdasarkan kriteria Anda.'
          : 'Tidak ada vendor yang memenuhi kriteria.',
      );
    } catch (e) {
      notify(`Gagal memuat rekomendasi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow='AI-POWERED SOURCING'
        title={
          <>
            Temukan vendor{' '}
            <span className='title-accent'>yang paling cocok.</span>
          </>
        }
        subtitle='Jelaskan kebutuhan Anda. VendAI menyusun shortlist berdasarkan risiko, harga, dan lead time vendor.'
        action={
          <span className='ai-status'>
            <span></span> AI Assistant aktif
          </span>
        }
      />
      <div className='recommend-layout'>
        <div className='panel criteria-panel'>
          <div className='panel-heading'>
            <div className='heading-icon'>
              <i className='bi bi-sliders2'></i>
            </div>
            <div>
              <h3>Kebutuhan pengadaan</h3>
              <p>Atur kriteria rekomendasi Anda.</p>
            </div>
          </div>
          <label className='form-label'>Kategori kebutuhan</label>
          <select
            className='form-select'
            value={need}
            onChange={(e) => {
              setNeed(e.target.value);
              setResults(null);
            }}
          >
            {mainCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className='form-label mt-4'>Produk / jasa</label>
          <select
            className='form-select'
            value={sub}
            onChange={(e) => {
              setSub(e.target.value);
              setResults(null);
            }}
          >
            {subCategories.map((c) => (
              <option key={c.sub_category}>{c.sub_category}</option>
            ))}
          </select>
          <label className='form-label mt-4'>Jumlah pesanan</label>
          <div className='input-group budget-input'>
            <input
              className='form-control'
              type='number'
              min='1'
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <span className='input-group-text'>{unit}</span>
          </div>
          <label className='form-label mt-4'>Anggaran maksimum</label>
          <div className='input-group budget-input'>
            <span className='input-group-text'>Rp</span>
            <input
              className='form-control'
              type='number'
              min='1'
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <div className='form-hint'>Anggaran total untuk kebutuhan ini.</div>
          <label className='form-label mt-4'>Sisa hari menuju acara</label>
          <div className='input-group budget-input'>
            <input
              className='form-control'
              type='number'
              min='1'
              placeholder='Kosongkan bila tanpa deadline'
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <span className='input-group-text'>hari</span>
          </div>
          <label className='form-label mt-4'>Prioritas utama</label>
          <div className='priority-options'>
            {PRIORITIES.map((p) => (
              <button
                key={p.label}
                className={`priority-option ${priority === p.label ? 'chosen' : ''}`}
                onClick={() => setPriority(p.label)}
              >
                <i className={`bi ${p.icon}`}></i>
                <span>
                  <b>{p.label}</b>
                  <small>{p.desc}</small>
                </span>
                <i
                  className={`bi ${priority === p.label ? 'bi-check-circle-fill' : 'bi-circle'} checkmark`}
                ></i>
              </button>
            ))}
          </div>
          <button
            className='btn btn-primary-custom w-100 mt-4'
            onClick={doSearch}
            disabled={loading || !sub || !quantity || !budget}
          >
            <i className='bi bi-stars me-2'></i>
            {loading ? 'Memproses...' : 'Generate rekomendasi'}
          </button>
          <div className='privacy-note'>
            <i className='bi bi-shield-check'></i> Vendor berisiko Tinggi
            otomatis dikecualikan.
          </div>
        </div>
        <div className='results-column'>
          <div className='ai-explanation'>
            <div className='ai-spark'>
              <i className='bi bi-stars'></i>
            </div>
            <div>
              <strong>
                {results
                  ? 'Analisis selesai. Ini shortlist Anda.'
                  : 'Siap menemukan vendor terbaik?'}
              </strong>
              <p>
                {results
                  ? `Prioritas “${priority}” diterapkan untuk ${sub} (${quantity} ${unit}).`
                  : 'VendAI menyaring vendor berdasarkan MOQ, anggaran, kapasitas, dan deadline, lalu mengurutkan berdasarkan risiko, harga, dan lead time.'}
              </p>
            </div>
            <div className='ai-pulse'>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className='results-toolbar'>
            <div>
              <h3>
                Vendor yang direkomendasikan{' '}
                <span className='count-pill'>{matches.length}</span>
              </h3>
              <p>Diurutkan berdasarkan {priority.toLowerCase()}.</p>
            </div>
            <button
              className='btn btn-sm btn-outline-custom'
              onClick={() => setPage('compare')}
            >
              <i className='bi bi-bar-chart me-2'></i>Bandingkan (
              {selected.length})
            </button>
          </div>
          {results && matches.length === 0 && (
            <div className='panel empty-state'>
              <i className='bi bi-search'></i>
              <h4>Tidak ada vendor yang cocok</h4>
              <p>Coba naikkan anggaran, kurangi jumlah, atau perpanjang deadline.</p>
            </div>
          )}
          {matches.map((v, i) => (
            <div
              className={`recommend-card ${i === 0 ? 'top-match' : ''}`}
              key={v.id}
            >
              <div className='recommend-card-top'>
                <VendorLogo vendor={v} />
                <div className='recommend-vendor-name'>
                  <div className='d-flex align-items-center gap-2 flex-wrap'>
                    <h4>
                      #{v.rank} {v.name}
                    </h4>
                    {v.verified && (
                      <span className='verified-label'>
                        <i className='bi bi-patch-check-fill'></i> Risiko rendah
                      </span>
                    )}
                  </div>
                  <span>
                    {v.subCategory} <i className='bi bi-dot'></i> {v.location}
                  </span>
                </div>
                <div className='match-score'>
                  <strong>{v.score}</strong>
                  <span>skor</span>
                </div>
              </div>
              <div className='match-progress'>
                <div style={{ width: `${v.score}%` }}></div>
              </div>
              <p className='recommend-desc'>{v.description}</p>
              <div className='vendor-stats'>
                <div>
                  <span>Total biaya</span>
                  <strong>{money(v.price)}</strong>
                  <small>
                    {money(v.unitPrice)}/{v.unit}
                  </small>
                </div>
                <div>
                  <span>Lead time</span>
                  <strong>
                    <i className='bi bi-truck'></i> {v.delivery}
                  </strong>
                </div>
                <div>
                  <span>Risk tier</span>
                  <strong>
                    {v.riskTier} <small>({v.onTime}% tepat waktu)</small>
                  </strong>
                </div>
              </div>
              <div className='recommend-bottom'>
                <div className='tag-list'>
                  {v.tags.slice(0, 2).map((t) => (
                    <span key={t} className='insight-tag'>
                      <i className='bi bi-check2'></i>
                      {t}
                    </span>
                  ))}
                </div>
                <div className='recommend-actions'>
                  <button
                    className={`btn btn-sm ${selected.includes(v.id) ? 'btn-selected' : 'btn-outline-custom'}`}
                    onClick={() => toggleVendor(v)}
                  >
                    <i
                      className={`bi ${selected.includes(v.id) ? 'bi-check2' : 'bi-plus-lg'} me-1`}
                    ></i>
                    {selected.includes(v.id) ? 'Dipilih' : 'Bandingkan'}
                  </button>
                  <button
                    className='btn btn-sm btn-primary-custom'
                    onClick={() => setDetail(v)}
                  >
                    Detail vendor <i className='bi bi-arrow-up-right ms-1'></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className='disclaimer'>
            <i className='bi bi-info-circle'></i>
            <span>
              Skor dihitung dari model risiko dan katalog vendor di database.
              Keputusan akhir tetap memerlukan verifikasi penawaran dan dokumen
              vendor.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Recommendations;
