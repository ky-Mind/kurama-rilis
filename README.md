# Kurama — unduhan aplikasi

Kurama adalah teman berpikir untuk ide, tulisan, dan kode, dibuat oleh **KyMind**.
Situs: https://kurama.xianzing.my.id

| Perangkat | Unduh |
|---|---|
| Android | [Kurama-android.apk](https://github.com/ky-Mind/kurama-rilis/releases/latest/download/Kurama-android.apk) |
| Debian / Ubuntu | [Kurama-linux-amd64.deb](https://github.com/ky-Mind/kurama-rilis/releases/latest/download/Kurama-linux-amd64.deb) |
| Linux lain | [Kurama-linux-x86_64.AppImage](https://github.com/ky-Mind/kurama-rilis/releases/latest/download/Kurama-linux-x86_64.AppImage) |
| Windows | [Kurama-windows-x64-setup.exe](https://github.com/ky-Mind/kurama-rilis/releases/latest/download/Kurama-windows-x64-setup.exe) |
| macOS | [Kurama-macos.dmg](https://github.com/ky-Mind/kurama-rilis/releases/latest/download/Kurama-macos.dmg) |

## Cara memasang
- **Android**: buka berkas APK, ketuk Pasang. Bila diminta, izinkan pemasangan dari browser.
- **Debian/Ubuntu**: `sudo apt install ./Kurama-linux-amd64.deb`
- **Linux lain**: `chmod +x Kurama-linux-x86_64.AppImage` lalu jalankan.
- **Windows**: jalankan `Kurama-windows-x64-setup.exe`. Bila muncul "Windows melindungi PC Anda", klik *Info selengkapnya* lalu *Tetap jalankan* (aplikasi belum bersertifikat penerbit berbayar).
- **macOS**: buka `Kurama-macos.dmg`, seret Kurama ke Applications. Pertama kali dibuka: klik kanan Kurama lalu *Buka* (aplikasi belum dinotarisasi Apple).

## Kode aplikasi desktop
Folder `desktop/` berisi aplikasi Electron. Paket Windows dan macOS dibuat otomatis oleh GitHub Actions
(`.github/workflows/build-desktop.yml`) lalu dilampirkan ke rilis.

© KyMind
