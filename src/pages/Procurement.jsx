import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { money } from '../components/Money.jsx';

function Procurement({ requests, setShowRequest, notify }) {
  const [filter, setFilter] = useState('Semua status');
  const shown = requests.filter(
    (r) => filter === 'Semua status' || r.status === filter,
  );
  return (
    <>
      <PageHeader
        eyebrow='PROCUREMENT WORKFLOW'
        title={
          <>
            Pengadaan yang{' '}
            <span className='title-accent'>lebih terorganisir.</span>
          </>
        }
        subtitle='Kelola permintaan, pantau proses, dan tindak lanjuti evaluasi vendor.'
        action={
          <button
            className='btn btn-primary-custom'
            onClick={() => setShowRequest(true)}
          >
            <i className='bi bi-plus-lg me-2'></i>Buat permintaan
          </button>
        }
      />
      <div className='procurement-summary row g-3'>
        <div className='col-md-4'>
          <div className='proc-stat'>
            <div className='proc-stat-icon blue'>
              <i className='bi bi-inbox'></i>
            </div>
            <div>
              <span>Total permintaan</span>
              <strong>{requests.length}</strong>
            </div>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='proc-stat'>
            <div className='proc-stat-icon orange'>
              <i className='bi bi-hourglass-split'></i>
            </div>
            <div>
              <span>Menunggu / proses</span>
              <strong>
                {requests.filter((r) => r.status !== 'Selesai').length}
              </strong>
            </div>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='proc-stat'>
            <div className='proc-stat-icon green'>
              <i className='bi bi-check2-circle'></i>
            </div>
            <div>
              <span>Selesai</span>
              <strong>
                {requests.filter((r) => r.status === 'Selesai').length}
              </strong>
            </div>
          </div>
        </div>
      </div>
      <div className='panel procurement-panel'>
        <div className='panel-heading'>
          <div>
            <h3>Daftar permintaan</h3>
            <p>Semua aktivitas pengadaan dalam workspace ini.</p>
          </div>
          <select
            className='form-select status-filter'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>Semua status</option>
            <option>Menunggu review</option>
            <option>Dalam proses</option>
            <option>Selesai</option>
          </select>
        </div>
        <div className='table-responsive'>
          <table className='table procurement-table align-middle'>
            <thead>
              <tr>
                <th>ID PERMINTAAN</th>
                <th>KEBUTUHAN</th>
                <th>ANGGARAN</th>
                <th>VENDOR</th>
                <th>TANGGAL</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className='request-id'>{r.id}</span>
                  </td>
                  <td>
                    <div className='request-name'>
                      <strong>{r.title}</strong>
                      <span>{r.category}</span>
                    </div>
                  </td>
                  <td className='fw-semibold'>{money(r.budget)}</td>
                  <td>
                    <span className='vendor-count'>
                      <i className='bi bi-buildings'></i>
                      {r.vendors} vendor
                    </span>
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <button
                      className='icon-button'
                      title='Lihat detail'
                      onClick={() =>
                        notify(`${r.id}: ${r.title}. Status: ${r.status}.`)
                      }
                    >
                      <i className='bi bi-chevron-right'></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <div className='empty-state'>
            <i className='bi bi-inbox'></i>
            <h4>Tidak ada permintaan</h4>
            <p>Tidak ada data untuk status ini.</p>
          </div>
        )}
        <div className='table-bottom-note'>
          Menampilkan {shown.length} dari {requests.length} permintaan
        </div>
      </div>
      <div className='workflow-steps'>
        <div className='workflow-heading'>
          <h3>Alur kerja pengadaan</h3>
          <p>Proses ringkas dari kebutuhan hingga keputusan.</p>
        </div>
        <div className='workflow-line'>
          <div className='workflow-step active'>
            <div>
              <i className='bi bi-clipboard2-plus'></i>
            </div>
            <strong>1. Buat kebutuhan</strong>
            <span>Tentukan kategori & anggaran</span>
          </div>
          <div className='workflow-step active'>
            <div>
              <i className='bi bi-stars'></i>
            </div>
            <strong>2. Rekomendasi AI</strong>
            <span>Temukan kandidat vendor</span>
          </div>
          <div className='workflow-step'>
            <div>
              <i className='bi bi-bar-chart'></i>
            </div>
            <strong>3. Evaluasi vendor</strong>
            <span>Bandingkan kriteria utama</span>
          </div>
          <div className='workflow-step'>
            <div>
              <i className='bi bi-check2-circle'></i>
            </div>
            <strong>4. Keputusan</strong>
            <span>Validasi penawaran final</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Procurement;
