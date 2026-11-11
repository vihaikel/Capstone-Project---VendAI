import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Metric from '../components/Metric.jsx';
import VendorLogo from '../components/VendorLogo.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function Overview({ setPage, vendors, requests, notify }) {
  return (
    <>
      <PageHeader
        eyebrow='SELAMAT DATANG KEMBALI'
        title={
          <>
            Keputusan pengadaan,{' '}
            <span className='title-accent'>lebih cerdas.</span>
          </>
        }
        subtitle='Pantau kebutuhan, temukan vendor terbaik, dan ambil keputusan berdasarkan data.'
        action={
          <button
            className='btn btn-primary-custom'
            onClick={() => setPage('recommendations')}
          >
            <i className='bi bi-stars me-2'></i>Mulai rekomendasi AI
          </button>
        }
      />
      <div className='welcome-banner'>
        <div className='banner-copy'>
          <div className='banner-tag'>
            <i className='bi bi-stars me-1'></i> VEND AI INSIGHT
          </div>
          <h2>
            Vendor yang tepat dimulai
            <br />
            dari keputusan yang tepat.
          </h2>
          <p>
            Bandingkan harga, kualitas, dan kecepatan pengiriman dalam satu
            tempat.
          </p>
          <button
            className='btn btn-white'
            onClick={() => setPage('recommendations')}
          >
            Temukan vendor <i className='bi bi-arrow-right ms-2'></i>
          </button>
        </div>
        <div className='banner-visual'>
          <div className='orbit orbit-one'></div>
          <div className='orbit orbit-two'></div>
          <div className='ai-orb'>
            <i className='bi bi-stars'></i>
          </div>
          <div className='float-chip chip-top'>
            <i className='bi bi-graph-up-arrow'></i>
            <span>
              <b>+18%</b>
              <small>Efisiensi biaya</small>
            </span>
          </div>
          <div className='float-chip chip-bottom'>
            <i className='bi bi-patch-check-fill'></i>
            <span>
              <b>96/100</b>
              <small>AI match score</small>
            </span>
          </div>
        </div>
      </div>
      <div className='section-title-row'>
        <div>
          <h2>Ringkasan bisnis</h2>
          <p>Gambaran umum aktivitas pengadaan Anda.</p>
        </div>
        <span className='period-label'>
          <i className='bi bi-calendar3 me-2'></i>Oktober 2026
        </span>
      </div>
      <div className='row g-3 metric-row'>
        <Metric
          icon='bi-buildings'
          color='blue'
          label='Total vendor'
          value={vendors.length}
          trend='+2 vendor'
          note='dibanding bulan lalu'
        />
        <Metric
          icon='bi-stars'
          color='purple'
          label='Rekomendasi tersedia'
          value='12'
          trend='+4 baru'
          note='berdasarkan kebutuhan'
        />
        <Metric
          icon='bi-wallet2'
          color='green'
          label='Potensi penghematan'
          value='Rp 4,8 jt'
          trend='18,6%'
          note='dari estimasi anggaran'
        />
        <Metric
          icon='bi-clipboard-check'
          color='orange'
          label='Permintaan aktif'
          value={requests.filter((r) => r.status !== 'Selesai').length}
          trend='2 aktif'
          note='perlu ditindaklanjuti'
        />
      </div>
      <div className='row g-3 mt-1'>
        <div className='col-lg-7'>
          <div className='panel h-100'>
            <div className='panel-heading'>
              <div>
                <h3>Rekomendasi unggulan</h3>
                <p>Vendor dengan skor kecocokan tertinggi.</p>
              </div>
              <button
                className='text-link'
                onClick={() => setPage('recommendations')}
              >
                Lihat semua <i className='bi bi-arrow-up-right'></i>
              </button>
            </div>
            {vendors
              .slice(0, 3)
              .sort((a, b) => b.score - a.score)
              .map((v, i) => (
                <div className='featured-vendor' key={v.id}>
                  <VendorLogo vendor={v} />
                  <div className='featured-info'>
                    <strong>{v.name}</strong>
                    <span>
                      {v.category} · {v.location}
                    </span>
                    <div className='mini-progress'>
                      <div style={{ width: `${v.score}%` }}></div>
                    </div>
                  </div>
                  <div className='featured-score'>
                    <strong>{v.score}</strong>
                    <small>match score</small>
                  </div>
                  <button
                    className='round-arrow'
                    onClick={() => setPage('vendors')}
                  >
                    <i className='bi bi-arrow-up-right'></i>
                  </button>
                </div>
              ))}
          </div>
        </div>
        <div className='col-lg-5'>
          <div className='panel h-100'>
            <div className='panel-heading'>
              <div>
                <h3>Aktivitas pengadaan</h3>
                <p>Status permintaan terbaru.</p>
              </div>
              <button
                className='text-link'
                onClick={() => setPage('procurement')}
              >
                Lihat semua <i className='bi bi-arrow-up-right'></i>
              </button>
            </div>
            <div className='activity-list'>
              {requests.slice(0, 3).map((r, i) => (
                <div className='activity-item' key={r.id}>
                  <div className={`activity-icon activity-${i}`}>
                    <i
                      className={`bi ${r.status === 'Selesai' ? 'bi-check2-circle' : r.status === 'Dalam proses' ? 'bi-arrow-repeat' : 'bi-hourglass-split'}`}
                    ></i>
                  </div>
                  <div className='activity-copy'>
                    <strong>{r.title}</strong>
                    <span>
                      {r.id} · {r.date}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
            <button
              className='btn btn-outline-custom w-100 mt-3'
              onClick={() => setPage('procurement')}
            >
              Kelola pengadaan <i className='bi bi-arrow-right ms-2'></i>
            </button>
          </div>
        </div>
      </div>
      <div className='tip-strip'>
        <div className='tip-icon'>
          <i className='bi bi-lightbulb'></i>
        </div>
        <div>
          <strong>Tips pengadaan</strong>
          <p>
            Gunakan prioritas yang jelas—harga, kualitas, atau kecepatan—agar
            rekomendasi AI lebih relevan.
          </p>
        </div>
        <button
          className='text-link ms-auto'
          onClick={() =>
            notify(
              'Tips: tetapkan anggaran dan kriteria sebelum membandingkan vendor.',
            )
          }
        >
          Pelajari <i className='bi bi-arrow-right'></i>
        </button>
      </div>
    </>
  );
}

export default Overview;
