# Parfumefy

Landing page parfum (React + Vite, tanpa database).

## Cara nambah produk (gampang)

1. Taruh foto produk di `public/images/` (JPG/PNG, usahakan minimal 1000x1000).
2. Tambah satu objek di `src/data/products.json` ke array `products`:
   - `id` (unik, huruf kecil + strip), `brand`, `name`, `size`, `concentration`,
   - `price` (angka rupiah, tanpa titik), `compareAt` (harga coret, atau `null`),
   - `notes` (array 3 aroma), `character` (satu kalimat), `vibe` (`Harian`/`Malam`),
   - `image` (`/images/nama-file.jpg`), `badge` (atau `null`).
3. Jalankan `npm run build` untuk memastikan tidak ada yang rusak.

## Perintah

- `npm install` — instal dependensi (sekali saja)
- `npm run dev` — jalanin lokal
- `npm run build` — build produksi ke `dist/`
