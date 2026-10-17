# Backup tools — dijalankan pada komputer tepercaya

Status 17 Oktober 2026: pengguna telah mengonfirmasi draft properti, simpan, upload foto, tiket, aktivitas akun, serta logout/login dengan MFA berhasil. Backup produksi, salinan off-site dan uji restore **belum dilakukan**. Alat ini baru diuji menggunakan data sintetis. Tidak ada password database atau server key pada repository ini.

## Persiapan Linux Mint

Dari clone repository `MenkiPlugcore/WebVillaBali`, cek:

```bash
node --version
python3 --version
command -v supabase docker psql gpg
```

Gunakan Node 22 atau lebih baru, Python 3, Supabase CLI resmi, Docker aktif, psql yang kompatibel dengan PostgreSQL 17, dan GPG. Jangan memasang stack Supabase lokal pada VPS Tripay 1 GB hanya untuk menjalankan backup. Desktop Linux Mint terpisah lebih sesuai untuk pekerjaan ini. Proses dump membaca database produksi, tidak mematikan layanan.

Instal dependensi repository dengan `npm ci`. Login Supabase CLI di terminalmu sendiri, lalu tautkan project **yang benar**:

```bash
supabase login
supabase link --project-ref tvcmwkzwemrwwewphfgh
python3 backend/backup/run.py preflight
```

CLI dapat meminta kredensial saat login/link. Isi langsung pada terminal/browser resmi, jangan kirim ke chat. Jika lupa password database, jangan reset sembarang karena mungkin dipakai integrasi lain; koordinasikan penggantian terlebih dahulu.

## Ekspor database dan foto

Hindari perubahan konten, unggahan dan migrasi selama ekspor. Tiket publik dapat tetap masuk; tiga dump database dijalankan terpisah dan foto berada pada layanan berbeda, sehingga ini bukan snapshot lintas layanan yang atomik. Jangan menandainya sebagai salinan pada satu detik yang persis sama. Untuk kebutuhan konsistensi lebih kuat, tentukan jendela pemeliharaan atau snapshot terkoordinasi terlebih dahulu.

```bash
python3 backend/backup/run.py backup --output "$HOME/aup-backups"
```

Prompt tersembunyi meminta **password database**, kemudian **server secret/service_role** dari project yang sama. Password panel admin bukan password database. Kunci server tetap di proses lokal dan tidak ditulis ke manifest maupun argumen perintah. Akses Docker dan environment lokal tetap harus terlindungi. Gunakan hanya komputer yang kamu kuasai.

Alur alat:

1. Periksa CLI, Docker, project-ref yang ditautkan dan folder output di luar repository.
2. Buat `roles.sql`, schema `public,aup_private`, dan data dengan COPY sesuai panduan CLI. Data Storage vektor dikecualikan sesuai panduan migrasi resmi. Periksa semua 14 tabel aplikasi, serta keberadaan data `auth.users` dan `auth.mfa_factors`. Jika CLI tidak menyertakan Auth, alat berhenti; jangan menganggap dump itu lengkap.
3. Unduh seluruh objek bucket privat `aup-media` dengan listing rekursif dan pagination. Simpan nama aslinya dalam manifest, bytes dalam nama lokal berbasis hash, checksum, ukuran dan tipe konten. Bucket tetap privat. Perubahan listing selama ekspor atau unduhan gagal membatalkan keberhasilan.
4. Verifikasi setiap checksum foto, lalu simpan manifest checksum database/foto. Informasi rahasia autentikasi, pesan pelanggan dan data lainnya dapat berada **dalam dump**, sehingga arsip diperlakukan sebagai data sensitif.
5. Enkripsi arsip menggunakan GPG AES-256. Masukkan passphrase enkripsi terpisah dan simpan cadangannya secara aman. File sementara lokal dihapus hanya setelah enkripsi berhasil. File terenkripsi dan `.sha256` disimpan di folder output.

Jika gagal, folder `aup-incomplete-*` privat dapat tersisa untuk diagnosis. Arsip plaintext juga dapat tersisa jika enkripsi gagal. Jangan unggah keduanya; periksa/hapus sendiri setelah diagnosis. Pada SSD, menghapus berkas bukan jaminan penghapusan fisik; enkripsi disk lokal tetap disarankan.

Menjalankan alat lagi menghasilkan ekspor baru, tidak mengubah produksi. Alat tidak punya perintah restore, hapus produksi, reset database, membuat project berbayar, atau mengubah akses admin.

## Salinan dan verifikasi off-site

Salin **arsip `.gpg` dan `.sha256`** ke lokasi milik owner yang terpisah dari komputer backup. Passphrase jangan disimpan bersama arsip. Pada lokasi salinan, jalankan `sha256sum -c NAMA-ARSIP.tar.gz.gpg.sha256`. Catat waktu, jumlah objek dan hasil; jangan menyebut backup off-site selesai sebelum file di tujuan diperiksa.

## Uji pemulihan terpisah

Ikuti `../RECOVERY-RUNBOOK.md` dan panduan resmi. Gunakan project kosong selain produksi, matikan integrasi pembayaran/WA/email keluar pada lingkungan uji, dan jangan arahkan website produksi ke sana. Pembuatan project yang menimbulkan biaya memerlukan keputusan owner.

1. Verifikasi checksum, dekripsi arsip lokal, periksa `backup-manifest.json`, lalu verifikasi foto dengan `node backend/backup/media.mjs verify DIREKTORI/media`.
2. Pulihkan roles/schema/data mengikuti urutan resmi dan ketentuan grant default. Karena tabel Auth/Storage dikelola Supabase, periksa versi/kolom dan encryption key yang diperlukan sebelum restore. Bucket metadata pada dump bukan bytes foto. Pulihkan bytes melalui Storage API menggunakan path pada manifest dan verifikasi ulang unduhan dari target.
3. Pulihkan konfigurasi Auth (signup mati, MFA), bucket privat, Edge Functions dan secrets target secara terpisah. Project API keys/JWT/encryption configuration tidak otomatis dipindahkan oleh dump aplikasi.
4. Cocokkan jumlah data dan referensi foto, sequence nomor tiket, izin publikasi tamu, owner/developer grants, RLS dan seluruh SQL regression fixtures. Lakukan login/MFA nyata di project uji; hash foto lokal saja belum membuktikan objek target bisa dibaca.
5. Catat waktu pemulihan, kegagalan dan persetujuan hasil. `restore_verified` dan `offsite_copy_verified` bernilai false pada manifest ekspor; keduanya bukan laporan keberhasilan otomatis.

Jadwal backup dan retensi belum diaktifkan. Pilihan jadwal/tujuan akan ditentukan sesudah ekspor dan uji restore pertama berhasil.

## Tes alat lokal

```bash
node --test backend/backup/media.test.mjs
python3 -m unittest discover -s backend/backup -p 'test_*.py'
```

7 tes media dan 3 tes coordinator lulus dengan fixture sintetis. Preflight pada lingkungan agent menemukan Supabase CLI, Docker, dan psql belum tersedia. Tidak ada uji ekspor database, enkripsi dengan data produksi, transfer off-site, maupun restore nyata yang diklaim selesai.

## Sumber resmi

- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/reference/cli/supabase-db-dump
- https://supabase.com/docs/reference/javascript/storage-from-list
- https://supabase.com/docs/reference/javascript/storage-from-download
