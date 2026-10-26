# Audit keamanan Agung Ubud Property

Tanggal: 26 Oktober 2026 (WIB). Lingkup: source WebVillaBali, lima Edge Function yang aktif, konfigurasi akses database dan Storage production, panel admin/developer, intake pelanggan, invoice BCA, serta integrasi PayPal.

Audit ini memadukan peninjauan source, pemeriksaan izin production, pengujian otomatis, tes SQL dalam transaksi rollback, dan pemeriksaan HTTP. Ini bukan sertifikasi pentest atau jaminan bahwa semua kerentanan telah ditemukan.

## Hasil dan perbaikan

Tidak ditemukan jalur kritis/tinggi untuk mengambil alih akses staf atau menandai invoice lunas tanpa kewenangan dalam lingkup yang diuji. Tiga penguatan berikut diterapkan:

| Temuan | Prioritas | Dampak sebelum perbaikan | Perbaikan |
| --- | --- | --- | --- |
| Webhook belum membatasi permintaan sebelum verifikasi eksternal; checkout memakai kuota baca yang sama untuk operasi provider | Sedang | Permintaan dengan header palsu dapat memicu pembacaan kredensial, OAuth, dan verifikasi PayPal berulang. Pemilik tautan invoice dapat memicu terlalu banyak pemeriksaan provider. Ini tidak melewati verifikasi pembayaran, tetapi menambah beban/risiko pembatasan API. | Kuota webhook atomik 60/menit per lingkungan sebelum pembacaan secret/OAuth. Operasi start/capture dibatasi 12/menit per invoice dan 120/menit secara global. Kuota baca tetap terpisah; respons 429 menyertakan Retry-After. Kunci kuota tidak dapat dibuat bebas melalui input pengunjung. |
| Upload hanya memeriksa signature awal foto | Rendah / pertahanan tambahan | File yang hanya berisi signature, container terpotong, atau dimensi sangat besar dapat lolos sebagai foto. Upload tetap memerlukan akun staf dengan MFA. | Periksa batas container JPG/PNG/WebP, metadata dimensi, foto statis, maksimal 40 megapiksel dan 12.000 piksel per sisi sebelum Storage. Batas file 8 MB dan body aktual tetap berlaku. |
| Header panel pada respons production mengikuti CSP umum aset | Rendah / pertahanan tambahan | Panel mendapat aturan style yang lebih longgar daripada konfigurasi khusus admin; aturan khusus tidak dijamin berlaku pada semua alias/redirect aset. | Worker menangani `/admin`, `/admin/*`, `/dev`, dan `/dev/*` lebih dahulu dan memaksakan CSP script/style self, no-store, no-referrer, noindex, serta larangan framing. Aturan juga berlaku untuk redirect, respons 404, dan HEAD. |

Peninjauan upload juga menemukan ketidaksesuaian ID folder momen tamu dan ID baris. Upload baru memakai ID yang sama. Foto lama tetap dapat ditampilkan di panel setelah barisnya lolos otorisasi pemanggil; pembatasan folder properti/motor tetap diperiksa.

## Kontrol yang diverifikasi

- Akun owner dan developer aktif sudah memiliki TOTP terverifikasi dan email terkonfirmasi. Akun staf yang dinonaktifkan tidak mendapat akses staf.
- Kewenangan berasal dari metadata aplikasi Auth terkini, bukan user_metadata. Operasi sensitif memeriksa sesi Auth yang masih ada, AAL2 pada token dan sesi, faktor TOTP aktif, batas sesi tujuh hari, serta pencabutan/perubahan peran. Grant developer yang dicabut atau kedaluwarsa ditolak.
- Seluruh 22 tabel aplikasi di public/aup_private memakai RLS. Tidak ada view aplikasi yang melewati RLS. Browser tidak diberi akses langsung ke tabel invoice, konfigurasi pembayaran, atau Vault.
- Fungsi public untuk operasi berhak istimewa memakai SECURITY INVOKER. Helper SECURITY DEFINER berada di schema privat dengan search_path kosong dan grant terbatas. Dispatcher backend pembayaran hanya dapat dipanggil service_role; implementasi dasar tidak diberikan kepada klien atau service_role.
- Karyawan/editor tidak dapat membaca tiket pelanggan atau keuangan, mengubah tujuan pembayaran, membuat akun staf, atau mengubah hak akses. Admin operasional tidak dapat mengganti rekening BCA secara langsung lewat RPC invoice. Owner/developer tetap mengendalikan konfigurasi merchant.
- Pengelola hanya dapat memperbarui status dan catatan internal tiket; data pelanggan dari intake tidak dapat ditimpa lewat panel. Tautan aktivasi staf terikat pada permintaan dan identitas yang berwenang serta tidak diterbitkan ulang untuk akun yang sudah mempunyai MFA.
- Bucket media privat; akses langsung tidak membuka objek. Pembuatan signed URL harus melewati pemeriksaan kelayakan data. Foto/testimoni terbit memerlukan consent. Secret server tidak ditemukan dalam pemindaian source teks yang dilacak git; publishable key frontend memang merupakan konfigurasi publik.
- Invoice yang terbit mengunci nominal, mata uang, rekening dan rincian transaksi. BCA memerlukan konfirmasi pengelola atas nominal dan referensi yang sesuai; referensi ganda ditolak.
- PayPal memakai nominal server, satu percobaan/order per invoice, kunci idempotensi tetap, merchant dan lingkungan yang sesuai, serta capture final COMPLETED dengan jumlah tepat. Redirect, return URL, atau klaim lunas dari browser tidak dapat mengubah status sendiri. Webhook wajib lolos verifikasi signature; replay tidak menggandakan pencatatan. Refund/reversal/dispute ditandai untuk tinjauan.
- Halaman pembayaran memakai token acak dalam fragment, tidak mengembalikan nama/email/telepon pelanggan, dan tidak dimasukkan ke sitemap. Halaman sensitif memakai no-store, no-referrer dan CSP ketat.

## Verifikasi

- `npm test`: **202 tes lulus**, tanpa kegagalan atau tes yang dilewati. Termasuk uji regresi file rusak/dimensi besar, batas provider sebelum OAuth, input pembayaran berlebih, escaping, role/MFA, dan header alias/redirect/HEAD.
- **12 suite SQL lulus pada database production**: `aup_access`, `developer_portal`, `gallery_management`, `guest_ticket_flow`, `inquiry_access`, `invoices`, `payments`, `service_inquiry`, `shared_panel`, `staff_management`, `staff_provisioning`, dan `staff_revocation`. Seluruh fixture, konfigurasi merchant simulasi, secret uji, dan penghitung kuota uji di-rollback; tidak ada pembayaran atau notifikasi kepada pelanggan.
- Suite invoice dan pembayaran juga dijalankan pada database lokal terisolasi. Stub Vault lokal bukan bukti enkripsi production; batas Vault dan grant-nya juga diuji lewat transaksi production.
- Browser memakai bundle aplikasi yang sebenarnya dengan API simulasi: owner/editor/developer, semua menu, lebar 320–1440 px, formulir, invoice, pengaturan, drawer/fokus, penolakan navigasi saat ada perubahan, penyimpanan, dan logout. Tidak ada error browser, pelanggaran CSP, atau overflow.
- Pemeriksaan HTTP meliputi penolakan RPC dan endpoint staf bagi anonim, webhook tanpa signature, field nominal palsu, origin asing, input katalog/foto tidak valid, akses media privat, header sensitif, dan pengecualian source/config/backend dari aset publik. Pendaftaran publik dan anonim dinonaktifkan.
- `npm audit`: **0 advisory yang diketahui** untuk dependency terpasang pada saat audit; ini tidak menjamin ketiadaan celah yang belum dipublikasikan.
- Supabase Security Advisor sesudah migrasi tidak menambah temuan: tersisa satu WARN password bocor dan tiga INFO tabel privat tanpa policy. Ketiga tabel sengaja tidak memiliki grant klien/policy yang mengizinkan akses; ini bukan alasan untuk membuka policy.

## Yang masih perlu dituntaskan sebelum pembayaran Live

1. **Uji PayPal Sandbox sungguhan dengan kredensial merchant owner.** Saat audit rekening BCA masih kosong dan belum ada akun PayPal terhubung. Tes saat ini mencakup simulasi API dan SQL, belum membuktikan koneksi merchant, delivery webhook dari PayPal, approve/cancel/fail/pending, dan capture pada layanan Sandbox. Gunakan dana simulasi; aktifkan Live setelah pengujian tersebut berhasil.
2. **Leaked-password protection belum aktif.** Supabase menyediakan fitur ini pada Pro ke atas. MFA sudah dipaksakan, tetapi tidak menggantikan pemeriksaan password bocor. Aktivasi fitur memerlukan keputusan paket oleh owner; audit tidak mengubah paket berbayar. [Panduan password Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
3. **Prosedur pemulihan dan operasional.** Owner perlu menyimpan cadangan authenticator di tempat aman, membatasi akses dashboard Supabase/GitHub/Cloudflare, dan menetapkan siapa yang meninjau refund/sengketa serta kegagalan webhook. Jangan membagikan secret melalui chat atau menaruhnya dalam source.

Kuota aplikasi membatasi pekerjaan provider, bukan perlindungan penuh terhadap DDoS. Trafik berbahaya yang memenuhi kuota bersama masih dapat menunda pelanggan sah sampai periode berikutnya. Penyesuaian limit dan perlindungan di gateway perlu mempertimbangkan trafik nyata. Tidak dilakukan load test, brute force, transaksi dana sungguhan, pemindaian malware lengkap, atau pengujian akses dashboard pihak ketiga. Validasi foto membaca struktur/dimensi tanpa mendekode seluruh piksel, memverifikasi semua CRC, atau menghapus metadata EXIF/GPS; pengelola tetap perlu memilih foto yang layak dipublikasikan. Audit tidak memverifikasi seluruh riwayat git atau menjamin secret tidak pernah tersimpan di tempat lain.

Keputusan penyimpanan tetap **source di GitHub saja**; audit ini tidak menambahkan backup database, foto, atau video.

## Acuan

- [Supabase: securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase: RLS Enabled No Policy advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [PayPal: webhook verification dan retry](https://developer.paypal.com/api/rest/webhooks/rest/)
- [OWASP: File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [WebP container specification](https://developers.google.com/speed/webp/docs/riff_container)
- [PNG specification](https://www.w3.org/TR/png-3/)

Changelog Supabase relevan diperiksa: project sudah memakai PostgreSQL 17.11; aplikasi tidak memakai ekstensi ltree/btree_gist atau PGP legacy yang dibahas pada pembaruan tersebut. Perubahan cipher TLS lama dijadwalkan oleh Supabase; tidak ada perubahan aplikasi yang diperlukan untuk runtime modern yang diuji.
