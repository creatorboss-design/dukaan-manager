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
        manualChunks: {
          // Firebase SDK modules — large, stable, change rarely → strong cache benefit
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          // PDF export — only needed on CashBook page
          pdf: ["jspdf", "jspdf-autotable"],
          // QR/barcode scanner — only needed on specific scan flows
          scanner: ["html5-qrcode"],
        },
      },
    },
  },
})
