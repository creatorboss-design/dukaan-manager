import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // rolldown (Vite 8) requires manualChunks as a function, not an object.
        // Map module IDs to named chunks for better cache efficiency:
        // - firebase: large SDK, rarely changes → stays cached across app deploys
        // - pdf: only needed by CashBook page
        // - scanner: only needed by barcode scan flows
        manualChunks(id) {
          if (
            id.includes("firebase/app") ||
            id.includes("firebase/auth") ||
            id.includes("firebase/firestore") ||
            id.includes("node_modules/@firebase") ||
            id.includes("node_modules/firebase")
          ) {
            return "firebase";
          }
          if (id.includes("node_modules/jspdf")) {
            return "pdf";
          }
          if (id.includes("node_modules/html5-qrcode")) {
            return "scanner";
          }
        },
      },
    },
  },
})
