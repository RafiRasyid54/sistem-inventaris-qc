// hooks/useBarcodeScanner.ts
// Menangkap input scanner barcode/RFID (keyboard wedge) secara global:
// karakter masuk cepat, diakhiri Enter. Diabaikan saat fokus ada di kolom isian.
// Dipakai halaman Kalibrasi dan modal kalibrasi.
import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  onScan: (code: string) => void;
  minLength?: number; // kode lebih pendek dari ini dianggap ketikan biasa
  maxGapMs?: number; // jeda antar karakter; lebih lama dari ini = buffer di-reset
}

export function useBarcodeScanner({ enabled, onScan, minLength = 4, maxGapMs = 100 }: Options) {
  // Simpan callback terbaru agar listener tidak dipasang ulang setiap render.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = Date.now();
      if (now - lastKeyTime > maxGapMs) buffer = "";
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= minLength) {
          // Cegah Enter dari scanner menekan tombol yang sedang fokus.
          e.preventDefault();
          const code = buffer;
          buffer = "";
          onScanRef.current(code);
        } else {
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, minLength, maxGapMs]);
}