# Invoice & pembayaran

## Ruang lingkup yang disepakati — 25 Oktober 2026

- Metode pembayaran: PayPal dan transfer Bank BCA.
- Source code disimpan di GitHub. Backup database, foto dan video tidak termasuk lingkup pekerjaan atas keputusan pengguna. Alat backup terdahulu tetap ada sebagai referensi dan tidak dijalankan.
- Kontak bisnis tetap diisi owner lewat Pengaturan website; perubahan ini tidak mengisi atau mengganti kontak bisnis.
- Jenis tagihan dibuat fleksibel: DP, pelunasan, pembayaran penuh atau lainnya. Fitur ini tidak mengasumsikan bahwa pembayaran jual beli properti telah disetujui oleh penyedia pembayaran.

## Penggunaan

1. Owner/admin atau developer dengan grant aktif masuk memakai MFA. Editor tidak memiliki akses invoice.
2. Buka Tiket pelanggan → Buat invoice dari tiket, atau menu Invoice & pembayaran.
3. Isi deskripsi, jenis tagihan, nominal dan jatuh tempo. BCA memakai IDR bulat; PayPal memakai USD sampai dua desimal. Perubahan metode mengosongkan nominal agar angka IDR tidak dianggap USD.
4. Simpan draft. Identitas pelanggan diambil dari tiket di server. Nomor invoice dibuat server; ulangi permintaan yang gagal dengan ID draft yang sama.
5. Untuk BCA, lengkapi rekening tujuan dan ketentuan pembayaran/pembatalan sebelum menerbitkan. Rincian dikunci setelah terbit. Cetak / simpan PDF memakai dialog browser dan dapat dikirim manual oleh pengelola.
6. Konfirmasi BCA hanya setelah pengelola mencocokkan dana pada mutasi rekening. Isi nominal yang persis sama dengan invoice dan nomor referensi transaksi. Referensi yang sama pada rekening yang sama tidak boleh melunasi dua invoice.
7. Draft dan invoice belum dibayar dapat dibatalkan dengan alasan. Invoice lunas tidak bisa dibatalkan atau diedit; refund belum tersedia.

## Batas tahap ini

- Tidak ada uang yang dipindahkan oleh fitur invoice ini. BCA diverifikasi manual oleh pengelola; tidak terhubung API bank dan tidak menilai bukti transfer secara otomatis.
- PayPal dapat disiapkan sebagai draft. Penerbitan dan pembayaran PayPal dinonaktifkan sampai akun merchant, create/capture server, webhook terverifikasi, pengujian sandbox dan rekonsiliasi siap. Tidak ada tombol pembayaran semu.
- Tidak ada tautan invoice publik, email/WA otomatis, unggah bukti transfer, pajak, refund, stok booking atau konversi kurs otomatis.
- PDF mengikuti bahasa pelanggan pada tiket. Gunakan ketentuan pembayaran/pembatalan yang disetujui owner.

## Batas akses

Data dan riwayat berada di `aup_private.invoices` dan `aup_private.invoice_events`, dengan RLS dan tanpa grant tabel/sequence ke anon/authenticated/service_role. Kebijakan tabel menolak akses langsung. Satu RPC publik security-invoker memanggil fungsi privat dengan pemeriksaan UID, live role, sesi, MFA dan grant developer yang sudah digunakan aplikasi. Tidak ada secret server pada browser.

Setiap aksi mengunci satu invoice dan memeriksa revisi. Nominal memakai integer satuan mata uang (IDR 1, USD 1/100) sampai 9 triliun satuan. Data server, status, identitas pelanggan dan jejak audit tidak dapat dikirim lewat payload edit. Status Lunas tidak tersedia untuk draft, invoice dibatalkan atau metode PayPal. Audit umum menyimpan actor asli dan ID invoice tanpa data pelanggan atau rekening.

## Verifikasi

- `npm test` dan `npm run build:admin`.
- `supabase/tests/invoices.sql`: fixture sintetis, transaksi diakhiri ROLLBACK; tidak memakai akun owner nyata, mengirim pesan atau memindahkan uang.
- Browser QA memakai jawaban API sintetis; tidak membuat invoice pelanggan nyata.
- Security Advisor sesudah migration. Peringatan pengamanan password yang sudah ada sebelum perubahan dibedakan dari masalah baru.

Hasil 25 Oktober 2026: 148 tes Node lulus. Uji SQL lulus pada PostgreSQL sementara dan pada project Supabase yang sebenarnya; seluruh fixture di-rollback dan jumlah invoice/event/pengguna fixture sesudah tes nol. Browser Chromium menguji bundle admin, empat ukuran layar (1440, 768, 390, 320), nominal salah, konfirmasi BCA, cetak A4 dan pembersihan data cetak setelah logout dengan respons API sintetis. Tidak ada transaksi pembayaran nyata yang dilakukan.

Migration yang terpasang: `20261025115403_invoice_foundation`. Tidak ada temuan keamanan baru. Peringatan lama [leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) dan informasi tabel internal yang sengaja tidak memiliki kebijakan akses tetap berada di luar perubahan ini. Indeks baru masih ditandai belum digunakan karena tabel belum berisi invoice bisnis.
