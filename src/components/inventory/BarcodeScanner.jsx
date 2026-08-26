import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "barcode-scanner-region",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(() => {});
      },
      () => {
        // ignore per-frame scan failures — fires constantly while scanning
      }
    );

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-gray-800 mb-3 text-center">📷 Scan Barcode / QR</h2>
        <div id="barcode-scanner-region" />
        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold active:scale-95 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
