/* Memberi tahu halaman bahwa ia berjalan di aplikasi desktop Kurama (static/native.js memakai ini). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kuramaDesktop", {
  platform: process.platform,
  // Warna bilah atas halaman (#rrggbb) untuk tombol jendela yang digambar di dalam aplikasi
  titleBar: (bg, fg) => ipcRenderer.send("kurama:titlebar", String(bg), String(fg)),
});
