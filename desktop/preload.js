/* Memberi tahu halaman bahwa ia berjalan di aplikasi desktop Kurama (static/native.js memakai ini). */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("kuramaDesktop", {
  platform: process.platform,
  version: process.env.npm_package_version || "",
});
