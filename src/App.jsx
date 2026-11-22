import React, { useEffect, useState } from 'react';
import { getCategories, getVendors } from './api.js';
import Procurement from './pages/Procurement.jsx';
import Compare from './pages/Compare.jsx';
import Vendors from './pages/Vendors.jsx';
import Recommendations from './pages/Recommendations.jsx';
import Overview from './pages/Overview.jsx';
import PageHeader from './components/PageHeader.jsx';
import Metric from './components/Metric.jsx';
import VendorLogo from './components/VendorLogo.jsx';
import StatusBadge from './components/StatusBadge.jsx';

const initialRequests = [
  {
    id: 'PR-2026-014',
    title: 'Kain terry untuk handuk custom',
    category: 'Bahan Baku',
    budget: 20000000,
    date: '28 Okt 2026',
    status: 'Menunggu review',
    vendors: 5,
  },
  {
    id: 'PR-2026-013',
    title: 'Produksi sajadah custom pernikahan',
    category: 'Kustomisasi & Produksi',
    budget: 12000000,
    date: '25 Okt 2026',
    status: 'Dalam proses',
    vendors: 3,
  },
  {
    id: 'PR-2026-012',
    title: 'Box hampers & kartu ucapan',
    category: 'Packaging',
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
  const [vendors, setVendors] = useState([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua kategori');
  const [sort, setSort] = useState('score');
  const [budget, setBudget] = useState('12000000');
  const [need, setNeed] = useState('Kustomisasi & Produksi');
  const [priority, setPriority] = useState('Seimbang');
  const [requests, setRequests] = useState(initialRequests);
  const [showRequest, setShowRequest] = useState(false);
  const [toast, setToast] = useState('');
  const [detail, setDetail] = useState(null);
  const [requestTitle, setRequestTitle] = useState(
    'Kain terry untuk handuk custom',
  );
  const [requestBudget, setRequestBudget] = useState('20000000');
  const [requestCategory, setRequestCategory] = useState('Bahan Baku');

  const mainCategories = [...new Set(categories.map((c) => c.main_category))];

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e) => setLoadError(e.message));
  }, []);

  // Filter, pencarian, dan sort dijalankan di server (GET /vendors).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      getVendors({ category, query, sort })
        .then((d) => {
          if (cancelled) return;
          setVendors(d.items);
          setVendorTotal(d.total);
          setLoadError('');
        })
        .catch((e) => !cancelled && setLoadError(e.message))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, query, sort]);

  const loadMore = () =>
    getVendors({ category, query, sort, offset: vendors.length })
      .then((d) => setVendors((current) => [...current, ...d.items]))
      .catch((e) => notify(e.message));

  // Vendor terpilih disimpan sebagai objek agar tetap ada walau daftar direktori berganti.
  const selectedIds = selected.map((v) => v.id);
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };
  const toggleVendor = (vendor) =>
    setSelected((current) =>
      current.some((v) => v.id === vendor.id)
        ? current.filter((v) => v.id !== vendor.id)
        : [...current, vendor],
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
          {loadError && (
            <div className='alert alert-warning d-flex align-items-center gap-2'>
              <i className='bi bi-exclamation-triangle-fill'></i>
              <span>
                Data vendor gagal dimuat: {loadError}. Pastikan API
                (<code>uvicorn app.main:app</code>) dan database berjalan.
              </span>
            </div>
          )}
          {page === 'overview' && (
            <Overview
              setPage={setPage}
              vendors={vendors}
              vendorTotal={vendorTotal}
              requests={requests}
              notify={notify}
            />
          )}
          {page === 'recommendations' && (
            <Recommendations
              categories={categories}
              need={need}
              setNeed={setNeed}
              budget={budget}
              setBudget={setBudget}
              priority={priority}
              setPriority={setPriority}
              selected={selectedIds}
              toggleVendor={toggleVendor}
              setPage={setPage}
              notify={notify}
              setDetail={setDetail}
            />
          )}
          {page === 'vendors' && (
            <Vendors
              vendors={vendors}
              vendorTotal={vendorTotal}
              loading={loading}
              loadMore={loadMore}
              mainCategories={mainCategories}
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              sort={sort}
              setSort={setSort}
              selected={selectedIds}
              toggleVendor={toggleVendor}
              setDetail={setDetail}
              notify={notify}
            />
          )}
          {page === 'compare' && (
            <Compare
              selectedVendors={selected}
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
                {mainCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
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
                <span>Risk tier</span>
                <strong>
                  {detail.riskTier}{' '}
                  <small>({detail.riskScore.toFixed(3)})</small>
                </strong>
              </div>
              <div>
                <span>Ketepatan waktu</span>
                <strong>{detail.onTime}%</strong>
              </div>
            </div>
            <h6 className='fw-bold mt-4 mb-3'>Detail item</h6>
            <ul className='reason-list'>
              <li>
                <i className='bi bi-check-circle-fill'></i> {detail.subCategory}:{' '}
                {money(detail.unitPrice)}/{detail.unit}, MOQ {detail.moq}{' '}
                {detail.unit}.
              </li>
              <li>
                <i className='bi bi-check-circle-fill'></i> Lead time{' '}
                {detail.delivery}.
              </li>
              <li>
                <i
                  className={`bi ${detail.tags.length > 1 ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'}`}
                ></i>{' '}
                {detail.tags.length > 1
                  ? `Kriteria teknis gagal: ${detail.tags.slice(1).join(', ')}.`
                  : 'Lolos semua kriteria teknis.'}
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
                  toggleVendor(detail);
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
