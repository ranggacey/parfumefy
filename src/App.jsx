import { useEffect, useMemo, useState } from 'react';
import data from './data/products.json';

/*
 * Parfumefy — landing page parfum.
 * Prinsip desain dari reels Marcelo Design X ("Stop Designing Boring Hero
 * Sections", ditonton tanpa login): satu hero satu jangkar (satu botol besar
 * di atas blok warna datar), headline sans raksasa dengan kontras skala ke
 * body kecil, dua CTA kontras, nav tipis, whitespace lega, tanpa ornamen.
 * Diadaptasi ke parfum: blok peach (model hero Yeezy), bento cream untuk
 * section notes, dan section gelap + glow ring (model ZYRO) untuk wangi malam.
 * Semua produk dibaca dari src/data/products.json — nambah produk = tambah
 * satu objek di JSON + satu file foto di public/images.
 */

const rp = (n) => `Rp${n.toLocaleString('id-ID')}`;
const waLink = (p) =>
  `https://wa.me/${data.shop.whatsapp}?text=${encodeURIComponent(
    `Halo Parfumefy, saya mau pesan ${p.brand} ${p.name} (${p.size}) — ${rp(p.price)}`
  )}`;
const waUmum =
  `https://wa.me/${data.shop.whatsapp}?text=${encodeURIComponent(
    'Halo Parfumefy, saya mau konsultasi pilih parfum.'
  )}`;

const FILTERS = ['Semua', 'Harian', 'Malam'];
const night = data.products.filter((p) => p.vibe === 'Malam');
const hero = data.products.find((p) => p.id === 'hmns-alpha') ?? data.products[0];

function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('on'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('on')),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function ProductCard({ p }) {
  return (
    <article className="card rv">
      <div className="card-img">
        <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" />
        {p.badge && <span className="card-badge">{p.badge}</span>}
      </div>
      <div className="card-body">
        <div className="card-brand">{p.brand} · {p.size}</div>
        <h3 className="card-name">{p.name}</h3>
        <div className="card-notes">
          {p.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <p className="card-char">{p.character}</p>
        <div className="card-price">
          <strong>{rp(p.price)}</strong>
          {p.compareAt && <s>{rp(p.compareAt)}</s>}
        </div>
        <a className="btn btn-dark btn-block" href={waLink(p)} target="_blank" rel="noreferrer">
          Pesan via WhatsApp
        </a>
      </div>
    </article>
  );
}

export default function App() {
  const [filter, setFilter] = useState('Semua');
  const shown = useMemo(
    () => (filter === 'Semua' ? data.products : data.products.filter((p) => p.vibe === filter)),
    [filter]
  );
  useReveal([filter]);

  return (
    <div className="page">
      <header className="nav">
        <a className="logo" href="#top">PARFUMEFY</a>
        <nav className="nav-links">
          <a href="#koleksi">Koleksi</a>
          <a href="#kenapa">Kenapa Kami</a>
          <a href="#malam">Wangi Malam</a>
        </nav>
        <a className="btn btn-dark btn-sm" href={waUmum} target="_blank" rel="noreferrer">
          Pesan Sekarang
        </a>
      </header>

      {/* HERO — satu jangkar: satu botol besar di atas blok warna datar */}
      <section className="hero" id="top">
        <div className="hero-text">
          <span className="eyebrow rv">100% Original · Siap kirim se-Indonesia</span>
          <h1 className="rv">
            WANGI YANG <span className="hl">NEMPEL.</span>
          </h1>
          <p className="hero-sub rv">
            {data.shop.tagline}. Kurasi HMNS, Mykonos, Afnan, dan Zimaya —
            dari yang segar buat harian sampai yang gelap buat malam hari.
          </p>
          <div className="hero-cta rv">
            <a className="btn btn-dark btn-lg" href="#koleksi">Lihat Koleksi</a>
            <a className="btn btn-line btn-lg" href="#malam">Wangi Malam</a>
          </div>
          <div className="hero-stats rv">
            <div><strong>{data.products.length}+</strong><span>Parfum kurasi</span></div>
            <div><strong>100%</strong><span>Original</span></div>
            <div><strong>24 jam</strong><span>Proses kirim</span></div>
          </div>
        </div>
        <div className="hero-visual rv">
          <div className="hero-arch">
            <img src={hero.image} alt={`${hero.brand} ${hero.name}`} />
            <div className="hero-pill">
              <span>{hero.brand} {hero.name}</span>
              <strong>{rp(hero.price)}</strong>
            </div>
            <span className="hero-badge">Best Seller</span>
          </div>
        </div>
      </section>

      {/* Marquee brand */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              HMNS ✦ MYKONOS ✦ AFNAN ✦ ZIMAYA ✦ 100% ORIGINAL ✦ HARGA JUJUR ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* KOLEKSI */}
      <section className="section" id="koleksi">
        <div className="sec-head rv">
          <div>
            <span className="eyebrow">Koleksi</span>
            <h2>Pilih wangimu.</h2>
          </div>
          <p className="sec-sub">
            Semua stok ready, foto produk asli. Ketuk “Pesan via WhatsApp”,
            pesananmu langsung nyambung ke admin.
          </p>
        </div>
        <div className="filters rv">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? 'chip on' : 'chip'}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        {shown.length === 0 && <p className="empty">Belum ada produk di kategori ini.</p>}
      </section>

      {/* BENTO — kenapa Parfumefy */}
      <section className="section bento" id="kenapa">
        <div className="bento-text rv">
          <span className="eyebrow">Kenapa Parfumefy</span>
          <h2>Bukan sekadar jualan botol.</h2>
          <p className="sec-sub">
            Kami kurasi satu-satu, bukan asal stok. Setiap parfum di halaman ini
            sudah kami cium, kami pakai, dan kami berani rekomendasikan.
          </p>
          <ul className="checks">
            <li><strong>01 — Original, bukan refill.</strong><br />Segel utuh, batch jelas, garansi uang kembali kalau terbukti palsu.</li>
            <li><strong>02 — Harga jujur.</strong><br />Harga coret itu harga pasaran, bukan harga karangan. Yang kamu lihat, itu yang kamu bayar.</li>
            <li><strong>03 — Konsultasi gratis.</strong><br />Bingung pilih? Ceritakan gayamu, kami rekomendasikan aromanya lewat WhatsApp.</li>
          </ul>
        </div>
        <div className="bento-tiles rv">
          <img className="tile tile-big" src="/images/hero-amber.jpg" alt="Suasana amber hangat" />
          <img className="tile tile-blob" src="/images/mykonos-dark-secret.jpg" alt="Mykonos Dark Secret" />
          <a className="tile tile-pink" href={waLink(night[0])} target="_blank" rel="noreferrer">
            <span>Produk Unggulan</span>
            <strong>{night[0].brand} {night[0].name}</strong>
            <em>{rp(night[0].price)}</em>
            <span className="tile-cta">Pesan →</span>
          </a>
        </div>
      </section>

      {/* MALAM — section gelap + glow ring */}
      <section className="night" id="malam">
        <div className="night-glow" aria-hidden="true" />
        <div className="night-inner">
          <span className="eyebrow light rv">Wangi Malam</span>
          <h2 className="night-word rv">MALAM</h2>
          <p className="night-sub rv">
            Buat yang keluar setelah gelap. Gelap, manis, dan nempel sampai pagi.
          </p>
          <div className="night-grid">
            {night.map((p) => (
              <article key={p.id} className="night-card rv">
                <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" />
                <div className="night-card-body">
                  <div className="card-brand light">{p.brand} · {p.size}</div>
                  <h3>{p.name}</h3>
                  <p>{p.character}</p>
                  <div className="card-price light">
                    <strong>{rp(p.price)}</strong>
                    {p.compareAt && <s>{rp(p.compareAt)}</s>}
                  </div>
                  <a className="btn btn-light btn-block" href={waLink(p)} target="_blank" rel="noreferrer">
                    Pesan
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Jaminan */}
      <section className="assure">
        <div className="rv"><strong>Segel utuh</strong><span>Botol datang tersegel, lengkap dengan box-nya.</span></div>
        <div className="rv"><strong>Packing aman</strong><span>Bubble wrap berlapis, dus tebal, anti pecah di jalan.</span></div>
        <div className="rv"><strong>Retur mudah</strong><span>Barang cacat atau salah kirim? Kami ganti, tanpa ribet.</span></div>
      </section>

      {/* CTA akhir */}
      <section className="final rv">
        <h2>Bingung pilih aroma?</h2>
        <p>Ceritakan gayamu — kerja, kuliah, atau malam minggu. Kami yang pilihkan.</p>
        <a className="btn btn-dark btn-lg" href={waUmum} target="_blank" rel="noreferrer">
          Konsultasi Gratis via WhatsApp
        </a>
      </section>

      <footer className="foot">
        <div className="logo">PARFUMEFY</div>
        <p>{data.shop.tagline}. Foto produk dari situs resmi brand. Harga dapat berubah sewaktu-waktu mengikuti stok.</p>
        <span>© 2026 Parfumefy</span>
      </footer>
    </div>
  );
}
