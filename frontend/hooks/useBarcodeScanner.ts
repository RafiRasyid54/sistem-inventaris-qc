// hooks/useBarcodeScanner.ts
import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  onScan: (code: string) => void;
  minLength?: number; 
  maxGapMs?: number; 
}

export function useBarcodeScanner({ 
  enabled, 
  onScan, 
  minLength = 4, 
  maxGapMs = 40 // Dioptimalkan ke 40ms (kecepatan hardware scanner murni)
}: Options) {
  
  const onScanRef = useRef(onScan);
  
  // Sinkronisasi ref dengan callback terbaru untuk menghindari stale closure
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    let buffer = "";
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      
      // Cegah intersep jika kursor user sedang aktif di dalam form
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
      
      // Reset buffer jika jeda waktu lebih lama dari maxGapMs (indikasi ketikan manusia)
      if (now - lastKeyTime > maxGapMs) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= minLength) {
          // Cegah Enter dari scanner men-trigger tombol/form secara global
          e.preventDefault();
          e.stopPropagation(); 
          
          const code = buffer;
          buffer = "";
          onScanRef.current(code);
        } else {
          buffer = "";
        }
      } else if (e.key.length === 1) {
        // e.key.length === 1 otomatis mengabaikan tombol modifier (Shift, Tab, dll)
        buffer += e.key;
      }
    };

    // Gunakan fase 'capture' (true) agar event dicegat sebelum turun ke elemen DOM lain
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, minLength, maxGapMs]);
}