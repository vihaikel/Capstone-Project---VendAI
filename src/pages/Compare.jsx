import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import VendorLogo from '../components/VendorLogo.jsx';
import { money } from '../components/Money.jsx';

function Compare({ selectedVendors, toggleVendor, vendors, setPage, notify }) {
  const [metric, setMetric] = useState('all');
  return (
    <>
      <PageHeader
        eyebrow='SIDE-BY-SIDE EVALUATION'
        title={
          <>
            Bandingkan sebelum <span className='title-accent'>memutuskan.</span>
          </>
        }
        subtitle='Lihat faktor utama secara transparan untuk memilih mitra yang sesuai.'
        action={
          <button
            className='btn btn-outline-custom'
            onClick={() => setPage('vendors')}
          >
            <i className='bi bi-plus-lg me-2'></i>Pilih vendor
          </button>
        }
      />
      <div className='compare-callout'>
        <i className='bi bi-stars'></i>
        <div>
          <strong>Rekomendasi VendAI</strong>
          <p>
            Jangan hanya melihat harga. Pertimbangkan juga kualitas, konsistensi
            pengiriman, dan kecocokan kebutuhan.
          </p>
        </div>
      </div>
      {selectedVendors.length < 2 ? (
        <div className='panel empty-state'>
          <i className='bi bi-bar-chart'></i>
          <h4>Pilih minimal 2 vendor</h4>
          <p>
            Tambahkan vendor dari Direktori vendor atau Rekomendasi AI untuk
            mulai membandingkan.
          </p>
          <button
            className='btn btn-primary-custom'
            onClick={() => setPage('vendors')}
          >
            Buka direktori vendor
          </button>
        </div>
      ) : (
        <div className='panel comparison-panel'>
          <div className='comparison-controls'>
            <div>
              <h3>Perbandingan vendor</h3>
              <p>{selectedVendors.length} vendor dipilih untuk evaluasi.</p>
            </div>
            <select
              className='form-select compare-filter'
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              <option value='all'>Semua metrik</option>
              <option value='commercial'>Metrik komersial</option>
              <option value='performance'>Performa vendor</option>
            </select>
          </div>
          <div className='table-responsive'>
            <table className='table comparison-table'>
              <thead>
                <tr>
                  <th className='metric-heading'>KRITERIA</th>
                  {selectedVendors.map((v) => (
                    <th key={v.id}>
                      <div className='compare-vendor-head'>
                        <VendorLogo vendor={v} />
                        <strong>{v.name}</strong>
                        <button onClick={() => toggleVendor(v.id)}>
                          <i className='bi bi-x-circle'></i> Hapus
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!metric || metric === 'all' || metric === 'commercial') && (
                  <>
                    <tr>
                      <td>Estimasi biaya</td>
                      {selectedVendors.map((v) => (
                        <td
                          key={v.id}
                          className={
                            v.price ===
                            Math.min(...selectedVendors.map((x) => x.price))
                              ? 'best-cell'
                              : ''
                          }
                        >
                          <strong>{money(v.price)}</strong>
                          {v.price ===
                            Math.min(
                              ...selectedVendors.map((x) => x.price),
                            ) && (
                            <small>
                              <i className='bi bi-check-circle-fill'></i>{' '}
                              Terendah
                            </small>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Waktu pengiriman</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>{v.delivery}</td>
                      ))}
                    </tr>
                  </>
                )}
                {(!metric || metric === 'all' || metric === 'performance') && (
                  <>
                    <tr>
                      <td>AI match score</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>
                          <div className='compare-score'>
                            <b>{v.score}/100</b>
                            <div className='mini-progress'>
                              <div style={{ width: `${v.score}%` }}></div>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Rating pengguna</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>
                          <i className='bi bi-star-fill star'></i>{' '}
                          <strong>{v.rating}</strong> / 5
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Ketepatan waktu</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>
                          <strong>{v.onTime}%</strong>
                          <div className='mini-progress'>
                            <div style={{ width: `${v.onTime}%` }}></div>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Indikator kualitas</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>
                          <strong>{v.quality}/100</strong>
                          <div className='mini-progress'>
                            <div style={{ width: `${v.quality}%` }}></div>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Status verifikasi</td>
                      {selectedVendors.map((v) => (
                        <td key={v.id}>
                          {v.verified ? (
                            <span className='verified-label'>
                              <i className='bi bi-patch-check-fill'></i>{' '}
                              Terverifikasi
                            </span>
                          ) : (
                            <span className='status-badge pending'>
                              Perlu verifikasi
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
                <tr>
                  <td>Rekomendasi</td>
                  {selectedVendors.map((v) => (
                    <td key={v.id}>
                      <span
                        className={`recommendation-label ${v.score === Math.max(...selectedVendors.map((x) => x.score)) ? 'recommended' : ''}`}
                      >
                        {v.score ===
                        Math.max(...selectedVendors.map((x) => x.score))
                          ? 'Pilihan unggulan'
                          : 'Alternatif'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className='comparison-footer'>
            <span>
              <i className='bi bi-info-circle me-2'></i>Gunakan data penawaran
              final sebelum menyetujui pembelian.
            </span>
            <button
              className='btn btn-primary-custom'
              onClick={() =>
                notify(
                  'Ringkasan perbandingan siap ditinjau. Integrasi ekspor dapat ditambahkan.',
                )
              }
            >
              Simpan hasil evaluasi <i className='bi bi-arrow-right ms-2'></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Compare;
