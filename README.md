# Aplikasi Pendaftaran Ahli Kariah

Aplikasi web ringkas untuk mendaftar ahli kariah menggunakan Node.js, Express, dan SQLite.

## Cara Menjalankan

1. Dapatkan Google Maps API Key dari [Google Cloud Console](https://console.cloud.google.com/).
2. Aktifkan Maps JavaScript API dan Places API untuk projek anda.
3. Gantikan `YOUR_GOOGLE_MAPS_API_KEY` dalam `public/register.html` dengan API key anda.
4. Pastikan Node.js dipasang.
5. Jalankan `npm install` untuk memasang dependencies.
6. Jalankan `npm start` untuk memulakan server.
7. Buka browser dan pergi ke `http://localhost:3000`.

## Ciri-ciri

- Halaman log masuk untuk admin dan user biasa.
- Landing page dengan menu navigasi dan dashboard selepas login.
- Borang pendaftaran ahli kariah dengan peta Google untuk pilih lokasi rumah (geolocation, search, klik/drag).
- Simpan data ke dalam pangkalan data SQLite.
- Admin boleh lihat senarai semua ahli kariah dalam table dengan search dan pagination menggunakan DataTables.
- User biasa boleh daftar ahli kariah.
- Dashboard menunjukkan jumlah ahli kariah dan tindakan cepat.

## Akaun Log Masuk

- **Admin**: username: admin, password: admin
- **User**: username: user, password: user

## Struktur Fail

- `server.js`: Server Express utama.
- `public/login.html`: Halaman log masuk.
- `public/index.html`: Halaman utama (selepas log masuk).
- `public/register.html`: Borang pendaftaran.
- `ahli_kariah.db`: Pangkalan data SQLite (dicipta secara automatik).