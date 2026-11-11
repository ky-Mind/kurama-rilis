/* Aplikasi desktop Kurama (KyMind): jendela sendiri yang membuka https://kurama.xianzing.my.id, tanpa Chrome.
   Isi tetap dari situs, jadi pembaruan web langsung ikut. Login Google/GitHub dibuka di browser bawaan sistem
   (Google melarang login di jendela aplikasi), lalu kembali ke aplikasi lewat kurama://masuk dengan kode
   sekali pakai + verifier rahasia milik aplikasi (mirip PKCE). */
const { app, BrowserWindow, Menu, shell, nativeTheme } = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "kurama.xianzing.my.id";
const HOME = `https://${HOST}/`;
const SCHEME = "kurama";

let win = null;
let splash = null;
let verifier = null;

app.setName("Kurama");
if (process.platform === "linux") app.commandLine.appendSwitch("class", "Kurama");

// Satu jendela saja: membuka Kurama lagi (atau tautan kurama://) memakai jendela yang sudah ada
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv) => {
    const link = argv.find((a) => a.startsWith(`${SCHEME}://`));
    if (link) handleLink(link);
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}
// macOS mengirim tautan lewat open-url
app.on("open-url", (e, url) => { e.preventDefault(); handleLink(url); });

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient(SCHEME, process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(SCHEME);
}

// ───────── Ukuran & posisi jendela diingat ─────────
const stateFile = () => path.join(app.getPath("userData"), "jendela.json");
function loadState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return { width: 1200, height: 820 }; }
}
function saveState() {
  if (!win || win.isDestroyed()) return;
  const b = win.getNormalBounds();
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...b, maximized: win.isMaximized() })); } catch { /* abaikan */ }
}

const background = () => (nativeTheme.shouldUseDarkColors ? "#262624" : "#faf9f5");

// ───────── Layar pembuka: rubah di tengah, KyMind di bawah ─────────
function createSplash() {
  splash = new BrowserWindow({
    width: 360, height: 360, frame: false, resizable: false, movable: true, show: false,
    transparent: false, backgroundColor: background(), skipTaskbar: true, alwaysOnTop: false,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  splash.loadFile(path.join(__dirname, "offline.html"), { query: { mode: "splash", dark: nativeTheme.shouldUseDarkColors ? "1" : "0" } });
  splash.once("ready-to-show", () => splash && splash.show());
}
function closeSplash() {
  if (splash && !splash.isDestroyed()) splash.close();
  splash = null;
}

function createWindow() {
  const s = loadState();
  win = new BrowserWindow({
    x: s.x, y: s.y, width: s.width || 1200, height: s.height || 820,
    minWidth: 380, minHeight: 480,
    show: false,
    title: "Kurama",
    backgroundColor: background(),
    autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  });
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} KuramaApp/${app.getVersion()} (Desktop)`);

  let shown = false;
  const reveal = () => {
    if (shown || !win) return;
    shown = true;
    if (s.maximized) win.maximize();
    win.show();
    setTimeout(closeSplash, 120);
  };
  win.once("ready-to-show", () => setTimeout(reveal, 350));
  setTimeout(reveal, 8000);

  // Tautan: halaman Kurama tetap di jendela ini, login ke browser sistem, situs lain ke browser sistem
  const route = (url) => {
    let u;
    try { u = new URL(url); } catch { return "deny"; }
    if (u.protocol === `${SCHEME}:`) { handleLink(url); return "deny"; }
    if (u.host === HOST) {
      const m = u.pathname.match(/^\/auth\/(google|github)\/login$/);
      if (m) { startLogin(m[1]); return "deny"; }
      return "allow";
    }
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") shell.openExternal(url);
    return "deny";
  };
  win.webContents.on("will-navigate", (e, url) => { if (route(url) === "deny") e.preventDefault(); });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (route(url) === "allow") win.loadURL(url);
    return { action: "deny" };
  });

  // Tanpa internet: halaman ramah dengan tombol coba lagi
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMain) => {
    if (!isMain || code === -3) return;  // -3 = dibatalkan (navigasi biasa)
    win.loadFile(path.join(__dirname, "offline.html"), { query: { dark: nativeTheme.shouldUseDarkColors ? "1" : "0", url: url || HOME } });
    reveal();
  });

  win.webContents.on("context-menu", (_e, p) => contextMenu(p));
  ["resize", "move"].forEach((ev) => win.on(ev, () => { clearTimeout(win._t); win._t = setTimeout(saveState, 400); }));
  win.on("close", saveState);
  win.on("closed", () => { win = null; });

  // Uji cepat (KURAMA_SMOKE=<berkas.png>): muat halaman, simpan tangkapan jendela + judul, lalu keluar
  if (process.env.KURAMA_SMOKE) {
    win.webContents.once("did-finish-load", () => setTimeout(async () => {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.KURAMA_SMOKE, img.toPNG());
      const info = await win.webContents.executeJavaScript("[location.href, document.title, document.documentElement.className].join(' | ')");
      console.log(`KURAMA_SMOKE ${info}`);
      app.quit();
    }, 2500));
  }

  const link = process.argv.find((a) => a.startsWith(`${SCHEME}://`));
  if (link) handleLink(link); else win.loadURL(HOME);
}

// ───────── Login lewat browser sistem ─────────
function startLogin(provider) {
  verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  shell.openExternal(`${HOME}auth/${provider}/login?app=${challenge}`);
}

function handleLink(link) {
  let u;
  try { u = new URL(link); } catch { return; }
  if (u.protocol !== `${SCHEME}:` || u.hostname !== "masuk") return;
  const code = u.searchParams.get("code");
  const v = verifier;
  verifier = null;
  if (!win) return;
  if (code && v) win.loadURL(`${HOME}auth/app/redeem?code=${encodeURIComponent(code)}&verifier=${encodeURIComponent(v)}`);
  else if (!win.webContents.getURL()) win.loadURL(`${HOME}login`);
  if (win.isMinimized()) win.restore();
  win.focus();
}

// ───────── Menu klik kanan: salin, tempel, ejaan ─────────
function contextMenu(p) {
  const items = [];
  for (const s of p.dictionarySuggestions || []) items.push({ label: s, click: () => win.webContents.replaceMisspelling(s) });
  if (p.misspelledWord) items.push({ label: "Tambahkan ke kamus", click: () => win.webContents.session.addWordToSpellCheckerDictionary(p.misspelledWord) }, { type: "separator" });
  if (p.linkURL) items.push({ label: "Buka tautan di browser", click: () => shell.openExternal(p.linkURL) }, { type: "separator" });
  if (p.isEditable) items.push({ role: "cut", label: "Potong" }, { role: "copy", label: "Salin" }, { role: "paste", label: "Tempel" }, { role: "selectAll", label: "Pilih semua" });
  else if (p.selectionText) items.push({ role: "copy", label: "Salin" });
  if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
}

// Menu aplikasi (tersembunyi, tekan Alt): pintasan salin/tempel, perbesar, muat ulang
function appMenu() {
  const isMac = process.platform === "darwin";
  return Menu.buildFromTemplate([
    ...(isMac ? [{ role: "appMenu" }] : []),
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    { label: "Tampilan", submenu: [{ role: "reload", label: "Muat ulang" }, { type: "separator" }, { role: "resetZoom", label: "Ukuran asli" }, { role: "zoomIn", label: "Perbesar" }, { role: "zoomOut", label: "Perkecil" }, { type: "separator" }, { role: "togglefullscreen", label: "Layar penuh" }] },
    { label: "Jendela", submenu: [{ role: "minimize", label: "Kecilkan" }, { role: "close", label: "Tutup" }] },
  ]);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(appMenu());
  createSplash();
  createWindow();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
