# Kertas — Editor Halaman ke PDF

Website sederhana untuk menyusun halaman dari nol (teks, gambar, kotak warna, warna latar, multi-halaman) lalu mengunduhnya sebagai satu file PDF. Semua proses terjadi di browser — tidak ada database, tidak ada server penyimpanan.

## Menjalankan di komputer sendiri

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Deploy ke Vercel

**Cara termudah (tanpa command line):**

1. Buat repository baru di GitHub, lalu unggah semua isi folder ini ke repo tersebut.
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repo tadi.
3. Vercel otomatis mendeteksi ini sebagai project Next.js — biarkan pengaturan default, klik **Deploy**.
4. Tunggu ±1 menit, situs langsung online dengan URL `namaproyek.vercel.app`.

**Lewat command line (Vercel CLI):**

```bash
npm install -g vercel
vercel login
vercel        # deploy versi preview
vercel --prod # deploy ke production
```

Tidak perlu mengatur environment variable apa pun — aplikasi ini murni berjalan di sisi klien (browser).

## Cara pakai

- **+ Teks / + Gambar / + Kotak warna** di sidebar kiri untuk menambah elemen ke halaman.
- Seret elemen untuk memindahkan, seret kotak kecil di sudut kanan-bawah untuk mengubah ukuran.
- Klik dua kali pada teks untuk mulai mengetik.
- Panel kanan muncul saat elemen dipilih — atur font, ukuran, warna, rata teks, warna isi kotak, dll.
- Tambah halaman lewat tombol **+ Halaman**, pindah antar halaman lewat thumbnail di sidebar.
- Tombol **Unduh sebagai PDF** akan merender setiap halaman dan menggabungkannya jadi satu file PDF ukuran A4.

## Struktur project

- `app/page.tsx` — seluruh logika editor (kanvas, elemen, drag/resize, ekspor PDF)
- `app/layout.tsx` — layout dasar + pemuatan font
- `app/globals.css` — token warna & reset gaya

Dibangun dengan Next.js 14, dan `html2canvas` + `jspdf` untuk ekspor PDF di sisi browser.
