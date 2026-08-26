// Electron main process — CommonJS (.cjs) to avoid ESM conflict with package.json "type":"module"
const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 840,
    minWidth: 360,
    minHeight: 640,
    title: "Dukaan Manager",
    // icon path is relative to the project root when packaged
    icon: path.join(__dirname, "../assets/icons/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // Load Vite dev server — run `npm run dev` first in another terminal
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // Load the production build packaged inside the asar
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// Single-instance lock — prevents a second window if the user double-clicks
// the taskbar/dock icon while the app is already open
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on("window-all-closed", () => {
  // On macOS it is common for applications to stay open even when all windows
  // are closed — keep the process alive so Cmd+Tab still works
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  // macOS: re-create window when the dock icon is clicked and no windows exist
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
