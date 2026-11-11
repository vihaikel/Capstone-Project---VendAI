import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import VendorLogo from '../components/VendorLogo.jsx';
import { money } from '../components/Money.jsx';

function Vendors({
  vendors,
  query,
  setQuery,
  category,
  setCategory,
  sort,
  setSort,
  selected,
  toggleVendor,
  setDetail,
  notify,
}) {
  return (
    <>
      <PageHeader
        eyebrow='VENDOR DIRECTORY'
        title={
          <>
            Semua vendor, <span className='title-accent'>satu tempat.</span>
          </>
        }
        subtitle='Cari, saring, dan tinjau profil vendor untuk kebutuhan bisnis Anda.'
        action={
          <button
            className='btn btn-primary-custom'
            onClick={() =>
              notify(
                'Form registrasi vendor dapat diintegrasikan dengan backend.',
              )
            }
          >
            <i className='bi bi-plus-lg me-2'></i>Tambah vendor
          </button>
        }
      />
      <div className='panel directory-panel'>
        <div className='directory-toolbar'>
          <div className='search-wrap'>
            <i className='bi bi-search'></i>
            <input
              className='form-control'
              placeholder='Cari nama vendor atau lokasi...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className='form-select filter-select'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Semua kategori</option>
            <option>Bahan baku</option>
            <option>Perlengkapan</option>
            <option>Logistik</option>
          </select>
          <select
            className='form-select filter-select'
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value='score'>Skor AI tertinggi</option>
            <option value='price'>Harga terendah</option>
            <option value='rating'>Rating tertinggi</option>
          </select>
        </div>
        <div className='directory-summary'>
          <span>
            <b>{vendors.length}</b> vendor ditemukan
          </span>
          <span>
            <i className='bi bi-check-circle-fill text-success me-1'></i>Data
            demo diperbarui
          </span>
        </div>
        <div className='table-responsive'>
          <table className='table vendor-table align-middle'>
            <thead>
              <tr>
                <th>VENDOR</th>
                <th>KATEGORI</th>
                <th>RATING</th>
                <th>ESTIMASI BIAYA</th>
                <th>AI SCORE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className='table-vendor'>
                      <VendorLogo vendor={v} />
                      <div>
                        <strong>{v.name}</strong>
                        <span>
                          {v.location}
                          {v.verified && (
                            <i
                              className='bi bi-patch-check-fill text-primary ms-1'
                              title='Terverifikasi'
                            ></i>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='category-chip'>{v.category}</span>
                  </td>
                  <td>
                    <span className='rating-value'>
                      <i className='bi bi-star-fill star'></i> {v.rating}
                    </span>
                  </td>
                  <td className='fw-semibold'>{money(v.price)}</td>
                  <td>
                    <div className='table-score'>
                      <b>{v.score}</b>
                      <div className='mini-progress'>
                        <div style={{ width: `${v.score}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className='table-actions'>
                      <button
                        className='icon-button'
                        title='Detail vendor'
                        onClick={() => setDetail(v)}
                      >
                        <i className='bi bi-eye'></i>
                      </button>
                      <button
                        className={`icon-button ${selected.includes(v.id) ? 'selected-action' : ''}`}
                        title='Pilih untuk perbandingan'
                        onClick={() => toggleVendor(v.id)}
                      >
                        <i
                          className={`bi ${selected.includes(v.id) ? 'bi-check-square-fill' : 'bi-plus-square'}`}
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendors.length === 0 && (
          <div className='empty-state'>
            <i className='bi bi-search'></i>
            <h4>Vendor tidak ditemukan</h4>
            <p>Coba ubah kata kunci atau filter kategori.</p>
          </div>
        )}
      </div>
      <div className='tip-strip'>
        <div className='tip-icon'>
          <i className='bi bi-bar-chart-line'></i>
        </div>
        <div>
          <strong>Butuh keputusan yang lebih cepat?</strong>
          <p>
            Pilih beberapa vendor lalu buka halaman Perbandingan untuk melihat
            metrik berdampingan.
          </p>
        </div>
        <button
          className='btn btn-outline-custom ms-auto'
          onClick={() =>
            notify(`Anda memilih ${selected.length} vendor untuk dibandingkan.`)
          }
        >
          Vendor dipilih: {selected.length}
        </button>
      </div>
    </>
  );
}

export default Vendors;
