/* Memberi tahu halaman bahwa ia berjalan di aplikasi desktop Kurama (static/native.js memakai ini). */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kuramaDesktop", {
  platform: process.platform,
  // Warna latar bilah atas halaman (#rrggbb)
  titleBar: (bg, fg) => ipcRenderer.send("kurama:titlebar", String(bg), String(fg)),
  // Tombol jendela buatan halaman: "min" | "max" | "close"
  windowAction: (action) => ipcRenderer.send("kurama:window", String(action)),
  onMaximized: (cb) => ipcRenderer.on("kurama:maximized", (_e, on) => cb(!!on)),
});
