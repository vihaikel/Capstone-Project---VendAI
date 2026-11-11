import React, { useMemo, useState } from 'react';
import Procurement from './pages/Procurement.jsx';
import Compare from './pages/Compare.jsx';
import Vendors from './pages/Vendors.jsx';
import Recommendations from './pages/Recommendations.jsx';
import Overview from './pages/Overview.jsx';
import PageHeader from './components/PageHeader.jsx';
import Metric from './components/Metric.jsx';
import VendorLogo from './components/VendorLogo.jsx';
import StatusBadge from './components/StatusBadge.jsx';

const vendorsSeed = [
  {
    id: 1,
    name: 'Sumber Makmur Supply',
    category: 'Bahan baku',
    initials: 'SM',
    color: 'mint',
    rating: 4.9,
    score: 96,
    price: 18500000,
    delivery: '2–3 hari',
    onTime: 98,
    quality: 96,
    location: 'Jakarta Selatan',
    verified: true,
    tags: ['Harga kompetitif', 'Pengiriman cepat'],
    description:
      'Pemasok bahan baku dan kebutuhan operasional untuk bisnis F&B dengan rekam jejak pengiriman konsisten.',
  },
  {
    id: 2,
    name: 'Prima Niaga Indonesia',
    category: 'Perlengkapan',
    initials: 'PN',
    color: 'blue',
    rating: 4.8,
    score: 91,
    price: 17200000,
    delivery: '3–4 hari',
    onTime: 94,
    quality: 93,
    location: 'Tangerang',
    verified: true,
    tags: ['Harga terbaik', 'Pilihan ekonomis'],
    description:
      'Distributor perlengkapan usaha dengan pilihan produk luas dan penawaran harga yang fleksibel.',
  },
  {
    id: 3,
    name: 'NusaLogistik Partner',
    category: 'Logistik',
    initials: 'NL',
    color: 'purple',
    rating: 4.7,
    score: 88,
    price: 19800000,
    delivery: '1–2 hari',
    onTime: 97,
    quality: 90,
    location: 'Bekasi',
    verified: true,
    tags: ['Pengiriman tercepat', 'Layanan responsif'],
    description:
      'Mitra distribusi dengan jangkauan pengiriman regional dan layanan pemenuhan pesanan cepat.',
  },
  {
    id: 4,
    name: 'Berkah Jaya Trading',
    category: 'Bahan baku',
    initials: 'BJ',
    color: 'orange',
    rating: 4.5,
    score: 82,
    price: 16400000,
    delivery: '5–6 hari',
    onTime: 88,
    quality: 89,
    location: 'Depok',
    verified: false,
    tags: ['Biaya rendah', 'Perlu verifikasi'],
    description:
      'Pemasok lokal dengan harga dasar menarik, perlu pengecekan dokumen dan konsistensi pengiriman.',
  },
  {
    id: 5,
    name: 'Cipta Usaha Mandiri',
    category: 'Perlengkapan',
    initials: 'CU',
    color: 'pink',
    rating: 4.6,
    score: 85,
    price: 19100000,
    delivery: '2–4 hari',
    onTime: 92,
    quality: 95,
    location: 'Jakarta Timur',
    verified: true,
    tags: ['Kualitas unggul', 'Garansi produk'],
    description:
      'Penyedia perlengkapan operasional yang menonjolkan kontrol kualitas dan dukungan purna jual.',
  },
];
const initialRequests = [
  {
    id: 'PR-2026-014',
    title: 'Pengadaan bahan baku bulanan',
    category: 'Bahan baku',
    budget: 20000000,
    date: '28 Okt 2026',
    status: 'Menunggu review',
    vendors: 5,
  },
  {
    id: 'PR-2026-013',
    title: 'Perlengkapan outlet baru',
    category: 'Perlengkapan',
    budget: 12000000,
    date: '25 Okt 2026',
    status: 'Dalam proses',
    vendors: 3,
  },
  {
    id: 'PR-2026-012',
    title: 'Jasa pengiriman area Jabodetabek',
    category: 'Logistik',
    budget: 8000000,
    date: '21 Okt 2026',
    status: 'Selesai',
    vendors: 4,
  },
];

const money = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

const navItems = [
  { id: 'overview', label: 'Ringkasan', icon: 'bi-grid-1x2' },
  { id: 'recommendations', label: 'Rekomendasi AI', icon: 'bi-stars' },
  { id: 'vendors', label: 'Direktori vendor', icon: 'bi-buildings' },
  { id: 'compare', label: 'Perbandingan', icon: 'bi-bar-chart' },
  { id: 'procurement', label: 'Pengadaan', icon: 'bi-clipboard-check' },
];

function App() {
  const [page, setPage] = useState('overview');
  const [vendors, setVendors] = useState(vendorsSeed);
  const [selected, setSelected] = useState([1, 2, 3]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua kategori');
  const [sort, setSort] = useState('score');
  const [budget, setBudget] = useState('20000000');
  const [need, setNeed] = useState('Bahan baku');
  const [priority, setPriority] = useState('Seimbang');
  const [searched, setSearched] = useState(false);
  const [requests, setRequests] = useState(initialRequests);
  const [showRequest, setShowRequest] = useState(false);
  const [toast, setToast] = useState('');
  const [detail, setDetail] = useState(null);
  const [requestTitle, setRequestTitle] = useState(
    'Pengadaan bahan baku bulanan',
  );
  const [requestBudget, setRequestBudget] = useState('20000000');
  const [requestCategory, setRequestCategory] = useState('Bahan baku');

  const filteredVendors = useMemo(() => {
    let data = vendors.filter(
      (v) =>
        (category === 'Semua kategori' || v.category === category) &&
        (v.name.toLowerCase().includes(query.toLowerCase()) ||
          v.location.toLowerCase().includes(query.toLowerCase())),
    );
    if (sort === 'price') data.sort((a, b) => a.price - b.price);
    else if (sort === 'rating') data.sort((a, b) => b.rating - a.rating);
    else data.sort((a, b) => b.score - a.score);
    return data;
  }, [vendors, query, category, sort]);
  const selectedVendors = vendors.filter((v) => selected.includes(v.id));
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };
  const toggleVendor = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  function saveRequest(e) {
    e.preventDefault();
    const item = {
      id: `PR-2026-${String(15 + requests.length - 3).padStart(3, '0')}`,
      title: requestTitle,
      category: requestCategory,
      budget: Number(requestBudget),
      date: '29 Okt 2026',
      status: 'Menunggu review',
      vendors:
        vendors.filter((v) => v.category === requestCategory).length ||
        vendors.length,
    };
    setRequests([item, ...requests]);
    setShowRequest(false);
    setPage('procurement');
    notify('Permintaan pengadaan berhasil dibuat.');
  }

  const pageTitle = navItems.find((n) => n.id === page)?.label || 'Ringkasan';

  return (
    <div className='app-shell'>
      <aside className='sidebar'>
        <div className='brand'>
          <div className='brand-mark'>
            <i className='bi bi-boxes'></i>
          </div>
          <div>
            <div className='brand-name'>
              Vend<span>AI</span>
            </div>
            <div className='brand-sub'>
              SISTEM REKOMENDASI VENDOR BERBASIS AI
            </div>
          </div>
        </div>
        <div className='workspace-label'>WORKSPACE</div>
        <nav className='nav flex-column side-nav'>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.id === 'recommendations' && (
                <span className='nav-new'>AI</span>
              )}
            </button>
          ))}
        </nav>
        <div className='sidebar-bottom'>
          <div className='help-card'>
            <div className='help-icon'>
              <i className='bi bi-lightbulb'></i>
            </div>
            <strong>Butuh bantuan?</strong>
            <p>Pelajari cara mendapatkan rekomendasi vendor terbaik.</p>
            <button
              onClick={() => notify('Panduan VendAI akan segera tersedia.')}
              className='btn btn-sm btn-light w-100'
            >
              Lihat panduan <i className='bi bi-arrow-up-right ms-1'></i>
            </button>
          </div>
          <div className='user-profile'>
            <div className='avatar-user'>GH</div>
            <div className='user-copy'>
              <strong>Gulamin Halim</strong>
              <small>Procurement Manager</small>
            </div>
            <button
              className='icon-button'
              aria-label='Menu profil'
              onClick={() => notify('Pengaturan profil demo.')}
            >
              <i className='bi bi-three-dots'></i>
            </button>
          </div>
        </div>
      </aside>

      <main className='main-area'>
        <header className='topbar'>
          <div className='breadcrumb-line'>
            <span>VendAI</span>
            <i className='bi bi-chevron-right'></i>
            <strong>{pageTitle}</strong>
          </div>
          <div className='top-actions'>
            <span className='status-pill'>
              <span></span> Workspace aktif
            </span>
            <button
              className='icon-button notification'
              aria-label='Notifikasi'
              onClick={() => notify('Tidak ada notifikasi baru.')}
            >
              <i className='bi bi-bell'></i>
              <b></b>
            </button>
            <div className='top-avatar'>GH</div>
          </div>
        </header>
        <div className='page-content'>
          {page === 'overview' && (
            <Overview
              setPage={setPage}
              vendors={vendors}
              requests={requests}
              notify={notify}
            />
          )}
          {page === 'recommendations' && (
            <Recommendations
              need={need}
              setNeed={setNeed}
              budget={budget}
              setBudget={setBudget}
              priority={priority}
              setPriority={setPriority}
              searched={searched}
              setSearched={setSearched}
              vendors={vendors}
              selected={selected}
              toggleVendor={toggleVendor}
              setPage={setPage}
              notify={notify}
              setDetail={setDetail}
            />
          )}
          {page === 'vendors' && (
            <Vendors
              vendors={filteredVendors}
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              sort={sort}
              setSort={setSort}
              selected={selected}
              toggleVendor={toggleVendor}
              setDetail={setDetail}
              notify={notify}
            />
          )}
          {page === 'compare' && (
            <Compare
              selectedVendors={selectedVendors}
              toggleVendor={toggleVendor}
              vendors={vendors}
              setPage={setPage}
              notify={notify}
            />
          )}
          {page === 'procurement' && (
            <Procurement
              requests={requests}
              setShowRequest={setShowRequest}
              notify={notify}
            />
          )}
        </div>
        <footer className='footer'>
          <span>© 2026 VendAI</span>
          <span>
            Vendor intelligence, made simple{' '}
            <i className='bi bi-heart-fill'></i>
          </span>
        </footer>
      </main>

      {showRequest && (
        <div
          className='modal-backdrop-custom'
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowRequest(false)
          }
        >
          <div className='modal-card'>
            <div className='modal-head'>
              <div>
                <span className='eyebrow'>PROCUREMENT REQUEST</span>
                <h3>Buat permintaan pengadaan</h3>
                <p>Isi kebutuhan agar vendor yang relevan dapat dievaluasi.</p>
              </div>
              <button
                className='icon-button'
                onClick={() => setShowRequest(false)}
              >
                <i className='bi bi-x-lg'></i>
              </button>
            </div>
            <form onSubmit={saveRequest}>
              <label className='form-label'>Nama kebutuhan</label>
              <input
                className='form-control mb-3'
                required
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
              />
              <label className='form-label'>Kategori</label>
              <select
                className='form-select mb-3'
                value={requestCategory}
                onChange={(e) => setRequestCategory(e.target.value)}
              >
                <option>Bahan baku</option>
                <option>Perlengkapan</option>
                <option>Logistik</option>
              </select>
              <label className='form-label'>Anggaran maksimum (Rp)</label>
              <input
                className='form-control mb-4'
                type='number'
                min='1'
                required
                value={requestBudget}
                onChange={(e) => setRequestBudget(e.target.value)}
              />
              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={() => setShowRequest(false)}
                >
                  Batal
                </button>
                <button className='btn btn-primary-custom' type='submit'>
                  <i className='bi bi-plus-lg me-2'></i>Buat permintaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detail && (
        <div
          className='modal-backdrop-custom'
          onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div className='modal-card'>
            <div className='modal-head'>
              <div className='vendor-identity'>
                <VendorLogo vendor={detail} />
                <div>
                  <h3>{detail.name}</h3>
                  <p>
                    {detail.category} · {detail.location}
                  </p>
                </div>
              </div>
              <button className='icon-button' onClick={() => setDetail(null)}>
                <i className='bi bi-x-lg'></i>
              </button>
            </div>
            <p className='detail-description'>{detail.description}</p>
            <div className='detail-score'>
              <div>
                <span>AI Match Score</span>
                <strong>
                  {detail.score}
                  <small>/100</small>
                </strong>
              </div>
              <div>
                <span>Rating vendor</span>
                <strong>
                  <i className='bi bi-star-fill star'></i> {detail.rating}
                </strong>
              </div>
              <div>
                <span>Ketepatan waktu</span>
                <strong>{detail.onTime}%</strong>
              </div>
            </div>
            <h6 className='fw-bold mt-4 mb-3'>Mengapa vendor ini relevan?</h6>
            <ul className='reason-list'>
              <li>
                <i className='bi bi-check-circle-fill'></i> Memenuhi kategori
                kebutuhan yang dipilih.
              </li>
              <li>
                <i className='bi bi-check-circle-fill'></i> Estimasi biaya dan
                waktu pengiriman dapat dibandingkan.
              </li>
              <li>
                <i className='bi bi-check-circle-fill'></i>{' '}
                {detail.verified
                  ? 'Profil vendor telah ditandai terverifikasi pada data demo.'
                  : 'Perlu verifikasi dokumen sebelum keputusan pembelian.'}
              </li>
            </ul>
            <div className='modal-actions mt-4'>
              <button
                className='btn btn-outline-secondary'
                onClick={() => setDetail(null)}
              >
                Tutup
              </button>
              <button
                className='btn btn-primary-custom'
                onClick={() => {
                  toggleVendor(detail.id);
                  setDetail(null);
                  notify('Daftar perbandingan diperbarui.');
                }}
              >
                <i className='bi bi-bar-chart me-2'></i>Tambah/keluarkan dari
                perbandingan
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className='toast-message'>
          <i className='bi bi-check-circle-fill'></i>
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
