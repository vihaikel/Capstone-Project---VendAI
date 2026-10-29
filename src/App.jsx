import React, { useMemo, useState } from 'react';

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
            <div className='brand-sub'>PROCUREMENT INTELLIGENCE</div>
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

function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className='page-heading'>
      <div>
        <div className='eyebrow'>{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className='heading-action'>{action}</div>}
    </div>
  );
}
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
function Metric({ icon, color, label, value, trend, note }) {
  return (
    <div className='col-6 col-xl-3'>
      <div className='metric-card'>
        <div className='metric-top'>
          <div className={`metric-icon ${color}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <button className='icon-button subtle' aria-label='Info metrik'>
            <i className='bi bi-three-dots'></i>
          </button>
        </div>
        <div className='metric-label'>{label}</div>
        <div className='metric-value'>{value}</div>
        <div className='metric-foot'>
          <span className='trend'>{trend}</span>
          <span>{note}</span>
        </div>
      </div>
    </div>
  );
}
function VendorLogo({ vendor }) {
  return (
    <div className={`vendor-logo ${vendor.color}`}>
      <span>{vendor.initials}</span>
      <i className='bi bi-circle-fill'></i>
    </div>
  );
}
function StatusBadge({ status }) {
  const cls =
    status === 'Selesai'
      ? 'done'
      : status === 'Dalam proses'
        ? 'progressing'
        : 'pending';
  return (
    <span className={`status-badge ${cls}`}>
      <span></span>
      {status}
    </span>
  );
}

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

export default App;
