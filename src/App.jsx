import { useEffect, useMemo, useRef, useState } from 'react';
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

/*
 * Parallax, dua lapis (nonaktifkan total kalau prefers-reduced-motion):
 * 1) Scroll: elemen [data-px] bergeser pelan berlawanan arah scroll
 *    (speed negatif = lapisan terasa lebih jauh). Nilai dijepit supaya tidak
 *    keluar dari wadahnya. Dijalankan via rAF, hanya properti transform.
 * 2) Mouse (desktop pointer halus saja): hero bergeser halus mengikuti
 *    kursor dengan lerp, visual dan teks bergerak berlawanan arah tipis.
 * Lapisan dipisah (scroll di .hero-px, mouse di .hero-mouse, melayang di
 * img) supaya transform-nya tidak saling menimpa.
 */
function useScrollParallax() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(document.querySelectorAll('[data-px]'));
    if (!els.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      els.forEach((el) => {
        const speed = parseFloat(el.dataset.px || '0');
        const clamp = parseFloat(el.dataset.pxClamp || '80');
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - vh / 2;
        const y = Math.max(-clamp, Math.min(clamp, center * speed));
        el.style.transform = el.hasAttribute('data-px-center')
          ? `translate(-50%, ${y.toFixed(1)}px)`
          : `translate3d(0, ${y.toFixed(1)}px, 0)`;
      });
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function useMouseParallax() {
  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const visual = hero.querySelector('.hero-mouse');
    const copy = hero.querySelector('.hero-text');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      raf = 0;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (visual) visual.style.transform = `translate3d(${(cx * -16).toFixed(2)}px, ${(cy * -12).toFixed(2)}px, 0)`;
      if (copy) copy.style.transform = `translate3d(${(cx * 8).toFixed(2)}px, ${(cy * 6).toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else if (tx === 0 && ty === 0) {
        if (visual) visual.style.transform = '';
        if (copy) copy.style.transform = '';
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/*
 * Morph saat scroll di hero (ala Morph PPT: satu objek berubah bentuk
 * mulus antar keadaan, bukan pindah kasar): --morph 0 saat hero masih
 * penuh di layar, 1 saat hero sudah keluar. CSS memakai variabel ini
 * untuk mengubah radius arch jadi membulat, memiringkan arch sedikit,
 * mengecilkan botol, dan memudarkan teks — semua properti mandiri
 * (border-radius/rotate/scale/opacity) supaya tidak menimpa transform
 * parallax yang sudah ada.
 */
function useScrollMorph() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = hero.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      hero.style.setProperty('--morph', p.toFixed(3));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function ProductCard({ p }) {
  return (
    <article className="card" data-card={p.id}>
      <div className="card-img">
        <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" />
        {p.badge && <span className="card-badge">{p.badge}</span>}
      </div>
      <div className="card-body">
        <div className="card-brand">{p.brand}, {p.size}</div>
        <h3 className="card-name">{p.name}</h3>
        <p className="card-notes">{p.notes.join(', ')}</p>
        <p className="card-char">{p.character}</p>
        <div className="card-price">
          <strong>{rp(p.price)}</strong>
          {p.compareAt && <s>{rp(p.compareAt)}</s>}
        </div>
        <a className="btn btn-ghost btn-block" href={waLink(p)} target="_blank" rel="noreferrer">
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
  useScrollParallax();
  useMouseParallax();
  useScrollMorph();

  // WebGL2 hero glow: dimuat malas (chunk terpisah) setelah halaman
  // tampil, nonaktif kalau prefers-reduced-motion. Kalau WebGL2 tidak
  // tersedia, init mengembalikan null dan kanvas tetap tersembunyi.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.querySelector('.hero-glow');
    if (!canvas) return;
    let cleanup = null;
    let dead = false;
    import('./webgl/heroGlow.js').then((m) => {
      if (dead) return;
      cleanup = m.initHeroGlow(canvas);
      if (cleanup) canvas.classList.add('on');
    }).catch(() => {});
    return () => {
      dead = true;
      if (cleanup) cleanup();
    };
  }, []);

  // Morph antar filter (ala Morph PPT: objek yang sama meluncur ke
  // posisi barunya, bukan hilang lalu muncul). Sebelum filter berubah,
  // rekam posisi tiap kartu; sesudah render, animasikan selisihnya.
  const gridRef = useRef(null);
  const prevRects = useRef(new Map());
  const setFilterMorph = (next) => {
    const grid = gridRef.current;
    if (grid) {
      const m = new Map();
      grid.querySelectorAll('[data-card]').forEach((el) => {
        m.set(el.dataset.card, el.getBoundingClientRect());
      });
      prevRects.current = m;
    }
    setFilter(next);
  };
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const grid = gridRef.current;
    const prev = prevRects.current;
    if (!grid || !prev.size) return;
    const vh = window.innerHeight;
    grid.querySelectorAll('[data-card]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return; // di luar layar: jangan dikedipkan
      const old = prev.get(el.dataset.card);
      if (!old) {
        el.animate(
          [{ opacity: 0, transform: 'scale(.92) translateY(14px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }],
          { duration: 350, easing: 'cubic-bezier(.22,.8,.3,1)' }
        );
        return;
      }
      const dx = old.left - r.left;
      const dy = old.top - r.top;
      if (dx || dy) {
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 420, easing: 'cubic-bezier(.22,.8,.3,1)' }
        );
      }
    });
    prevRects.current = new Map();
  }, [filter]);

  return (
    <div className="page">
      <header className="nav">
        <a className="logo" href="#top">Parfumefy</a>
        <nav className="nav-links">
          <a href="#koleksi">Koleksi</a>
          <a href="#kenapa">Kenapa Kami</a>
          <a href="#malam">Wangi Malam</a>
        </nav>
        <a className="btn btn-ghost btn-sm" href={waUmum} target="_blank" rel="noreferrer">
          Pesan Sekarang
        </a>
      </header>

      {/* HERO — satu jangkar: satu botol besar di atas blok warna datar */}
      <section className="hero" id="top">
        <canvas className="hero-glow" aria-hidden="true" />
        <div className="hero-text">
          <span className="kicker rv">100% original, kirim se-Indonesia</span>
          <h1 className="rv">
            Wangi yang nempel.<br />
            <em>harga yang masuk akal.</em>
          </h1>
          <p className="hero-sub rv">
            {data.shop.tagline}. Kurasi HMNS, Mykonos, Afnan, dan Zimaya,
            dari yang segar buat harian sampai yang gelap buat malam hari.
          </p>
          <div className="hero-cta rv">
            <a className="btn btn-amber btn-lg" href="#koleksi">Lihat Koleksi</a>
            <a className="btn btn-ghost btn-lg" href="#malam">Wangi Malam</a>
          </div>
          <p className="hero-note rv">{data.products.length} parfum kurasi, garansi uang kembali kalau terbukti palsu.</p>
        </div>
        <div className="hero-visual rv">
          <div className="hero-px" data-px="-0.18" data-px-clamp="100">
            <div className="hero-mouse">
              <div className="hero-arch" data-px="-0.06" data-px-clamp="40">
                <img src={hero.image} alt={`${hero.brand} ${hero.name}`} />
                <div className="hero-pill" data-px="-0.25" data-px-center data-px-clamp="40">
                  <span>{hero.brand} {hero.name}</span>
                  <strong>{rp(hero.price)}</strong>
                </div>
                <span className="hero-badge" data-px="-0.3" data-px-clamp="50">Best Seller</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee brand */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="mq-set" key={i}>
              <span>HMNS</span><span>Mykonos</span><span>Afnan</span><span>Zimaya</span>
              <span>100% original</span><span>Harga jujur</span>
            </div>
          ))}
        </div>
      </div>

      {/* KOLEKSI */}
      <section className="section" id="koleksi">
        <div className="sec-head">
          <div>
            <span className="kicker">Koleksi</span>
            <h2>Pilih wangimu.</h2>
          </div>
          <p className="sec-sub">
            Semua stok ready, foto produk asli. Ketuk “Pesan via WhatsApp”,
            pesananmu langsung nyambung ke admin.
          </p>
        </div>
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={filter === f ? 'chip on' : 'chip'}
              onClick={() => setFilterMorph(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid" ref={gridRef}>
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        {shown.length === 0 && <p className="empty">Belum ada produk di kategori ini.</p>}
      </section>

      {/* BENTO — kenapa Parfumefy */}
      <section className="section bento" id="kenapa">
        <div className="bento-text">
          <span className="kicker">Kenapa Parfumefy</span>
          <h2>Bukan sekadar jualan botol.</h2>
          <p className="sec-sub">
            Kami kurasi satu-satu, bukan asal stok. Setiap parfum di halaman ini
            sudah kami cium, kami pakai, dan kami berani rekomendasikan.
          </p>
          <ul className="checks">
            <li><strong>Original, bukan refill.</strong><br />Segel utuh, batch jelas, garansi uang kembali kalau terbukti palsu.</li>
            <li><strong>Harga jujur.</strong><br />Harga coret itu harga pasaran, bukan harga karangan. Yang kamu lihat, itu yang kamu bayar.</li>
            <li><strong>Konsultasi gratis.</strong><br />Bingung pilih? Ceritakan gayamu, kami rekomendasikan aromanya lewat WhatsApp.</li>
          </ul>
        </div>
        <div className="bento-tiles">
          <div className="tile-px">
            <img data-px="-0.2" data-px-clamp="30" className="tile" src="/images/hero-amber.jpg" alt="Suasana amber hangat" />
          </div>
          <img className="tile tile-blob" src="/images/mykonos-dark-secret.jpg" alt="Mykonos Dark Secret" />
          <a className="tile tile-dark" href={waLink(night[0])} target="_blank" rel="noreferrer">
            <span>Produk unggulan</span>
            <strong>{night[0].brand} {night[0].name}</strong>
            <em>{rp(night[0].price)}</em>
            <span className="tile-cta">Pesan</span>
          </a>
        </div>
      </section>

      {/* MALAM — section gelap + glow ring */}
      <section className="night" id="malam">
        <div className="night-glow" data-px="-0.12" data-px-clamp="80" data-px-center aria-hidden="true" />
        <div className="night-inner">
          <span className="kicker light">Wangi malam</span>
          <div className="night-word-px" data-px="-0.3" data-px-clamp="120">
            <h2 className="night-word">MALAM</h2>
          </div>
          <p className="night-sub">
            Buat yang keluar setelah gelap. Gelap, manis, dan nempel sampai pagi.
          </p>
          <div className="night-grid">
            {night.map((p) => (
              <article key={p.id} className="night-card">
                <img src={p.image} alt={`${p.brand} ${p.name}`} loading="lazy" />
                <div className="night-card-body">
                  <div className="card-brand light">{p.brand}, {p.size}</div>
                  <h3>{p.name}</h3>
                  <p>{p.character}</p>
                  <div className="card-price light">
                    <strong>{rp(p.price)}</strong>
                    {p.compareAt && <s>{rp(p.compareAt)}</s>}
                  </div>
                  <a className="btn btn-ghost btn-block" href={waLink(p)} target="_blank" rel="noreferrer">
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
        <div><strong>Segel utuh</strong><span>Botol datang tersegel, lengkap dengan box-nya.</span></div>
        <div><strong>Packing aman</strong><span>Bubble wrap berlapis, dus tebal, anti pecah di jalan.</span></div>
        <div><strong>Retur mudah</strong><span>Barang cacat atau salah kirim? Kami ganti, tanpa ribet.</span></div>
      </section>

      {/* CTA akhir */}
      <section className="final">
        <h2>Bingung pilih aroma?</h2>
        <p>Ceritakan gayamu — kerja, kuliah, atau malam minggu. Kami yang pilihkan.</p>
        <a className="btn btn-amber btn-lg" href={waUmum} target="_blank" rel="noreferrer">
          Konsultasi Gratis via WhatsApp
        </a>
      </section>

      <footer className="foot">
        <div className="logo">Parfumefy</div>
        <p>{data.shop.tagline}. Foto produk dari situs resmi brand. Harga dapat berubah sewaktu-waktu mengikuti stok.</p>
        <span>© 2026 Parfumefy</span>
      </footer>
    </div>
  );
}
