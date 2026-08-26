// Electron preload script — CommonJS (.cjs)
// Empty for now. contextBridge.exposeInMainWorld() calls go here if the app
// ever needs native OS features (system notifications, file access beyond what
// the browser already provides). Firebase, IndexedDB offline persistence, and
// everything currently in src/ works inside Electron's Chromium renderer
// with no bridge needed.
const { contextBridge } = require("electron");

// Example of future use (commented out):
// contextBridge.exposeInMainWorld("electronAPI", {
//   platform: process.platform,
// });
