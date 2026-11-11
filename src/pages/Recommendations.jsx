import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import VendorLogo from '../components/VendorLogo.jsx';
import { money } from '../components/Money.jsx';

function Recommendations({
  need,
  setNeed,
  budget,
  setBudget,
  priority,
  setPriority,
  searched,
  setSearched,
  vendors,
  selected,
  toggleVendor,
  setPage,
  notify,
  setDetail,
}) {
  const matches = vendors
    .filter((v) => v.category === need)
    .sort((a, b) => {
      if (priority === 'Harga terendah') return a.price - b.price;
      if (priority === 'Kualitas') return b.quality - a.quality;
      if (priority === 'Pengiriman tercepat')
        return parseInt(a.delivery) - parseInt(b.delivery);
      return b.score - a.score;
    });
  const doSearch = () => {
    setSearched(true);
    notify('Rekomendasi diperbarui berdasarkan kriteria Anda.');
  };
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
        subtitle='Jelaskan kebutuhan Anda. VendAI membantu menyusun shortlist berdasarkan kriteria pengadaan.'
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
              setSearched(false);
            }}
          >
            <option>Bahan baku</option>
            <option>Perlengkapan</option>
            <option>Logistik</option>
          </select>
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
          <label className='form-label mt-4'>Prioritas utama</label>
          <div className='priority-options'>
            {[
              {
                label: 'Seimbang',
                icon: 'bi-stars',
                desc: 'Nilai keseluruhan',
              },
              {
                label: 'Harga terendah',
                icon: 'bi-wallet2',
                desc: 'Optimalkan biaya',
              },
              {
                label: 'Kualitas',
                icon: 'bi-award',
                desc: 'Utamakan kualitas',
              },
              {
                label: 'Pengiriman tercepat',
                icon: 'bi-truck',
                desc: 'Hemat waktu',
              },
            ].map((p) => (
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
          >
            <i className='bi bi-stars me-2'></i>Generate rekomendasi
          </button>
          <div className='privacy-note'>
            <i className='bi bi-shield-check'></i> Hasil demo menggunakan data
            vendor contoh.
          </div>
        </div>
        <div className='results-column'>
          <div className='ai-explanation'>
            <div className='ai-spark'>
              <i className='bi bi-stars'></i>
            </div>
            <div>
              <strong>
                {searched
                  ? 'Analisis selesai. Ini shortlist Anda.'
                  : 'Siap menemukan vendor terbaik?'}
              </strong>
              <p>
                {searched
                  ? `Prioritas “${priority}” diterapkan untuk kategori ${need.toLowerCase()}.`
                  : 'AI mengevaluasi kecocokan kategori, anggaran, rating, kualitas, dan performa pengiriman.'}
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
          {matches.map((v, i) => (
            <div
              className={`recommend-card ${i === 0 ? 'top-match' : ''}`}
              key={v.id}
            >
              <div className='recommend-card-top'>
                <VendorLogo vendor={v} />
                <div className='recommend-vendor-name'>
                  <div className='d-flex align-items-center gap-2 flex-wrap'>
                    <h4>{v.name}</h4>
                    {v.verified && (
                      <span className='verified-label'>
                        <i className='bi bi-patch-check-fill'></i> Terverifikasi
                      </span>
                    )}
                  </div>
                  <span>
                    {v.category} <i className='bi bi-dot'></i> {v.location}
                  </span>
                </div>
                <div className='match-score'>
                  <strong>{v.score}</strong>
                  <span>AI match</span>
                </div>
              </div>
              <div className='match-progress'>
                <div style={{ width: `${v.score}%` }}></div>
              </div>
              <p className='recommend-desc'>{v.description}</p>
              <div className='vendor-stats'>
                <div>
                  <span>Estimasi biaya</span>
                  <strong>{money(v.price)}</strong>
                </div>
                <div>
                  <span>Pengiriman</span>
                  <strong>
                    <i className='bi bi-truck'></i> {v.delivery}
                  </strong>
                </div>
                <div>
                  <span>Rating</span>
                  <strong>
                    <i className='bi bi-star-fill star'></i> {v.rating}{' '}
                    <small>({v.onTime}% tepat waktu)</small>
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
                    onClick={() => toggleVendor(v.id)}
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
              Skor dan estimasi pada halaman ini merupakan data simulasi untuk
              prototipe. Keputusan akhir tetap memerlukan verifikasi penawaran
              dan dokumen vendor.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Recommendations;
