"use client";
import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { IconId, IconAlertTriangle, IconSearch } from "@tabler/icons-react";
import { useBarcodeScanner } from "/hooks/useBarcodeScanner";

export interface PeminjamOption {
  id: string;
  nama: string;
}

interface PengembalianScanFormProps {
  onScan: (idCard: string) => void;
  loading?: boolean;
  error?: string | null;
  peminjamOptions?: PeminjamOption[];
}

const CSS = `
.pln-ps{max-width:560px;margin:8px auto 24px;background:#fff;border:1px solid #dbe5f1;border-top:4px solid #ffc20e;
  border-radius:20px;padding:34px 30px 30px;text-align:center}
.pln-ps .ps-ring{width:92px;height:92px;border-radius:50%;margin:0 auto 18px;display:grid;place-items:center;
  background:#e6f0fa;color:#0b6bb8;position:relative}
.pln-ps .ps-ring::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid #0b6bb8;opacity:.35;
  animation:psPulse 1.8s ease-out infinite}
@keyframes psPulse{from{transform:scale(.85);opacity:.5}to{transform:scale(1.25);opacity:0}}
@media (prefers-reduced-motion:reduce){.pln-ps .ps-ring::after{animation:none}}
.pln-ps h5{font-weight:800;color:#06355f;margin:0 0 6px}
.pln-ps .ps-sub{font-size:.88rem;color:#62708a;margin:0 auto 22px;max-width:380px;line-height:1.55}
.pln-ps .form-control{background:#f6f9fc;border-color:#dbe5f1;border-radius:12px;padding:12px 14px;text-align:center;letter-spacing:.15em}
.pln-ps .form-control:focus{background:#fff;border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
.pln-ps .ps-btn{border:0;border-radius:12px;padding:12px 20px;font-weight:700;background:#ffc20e;color:#06355f;
  display:inline-flex;align-items:center;justify-content:center;gap:6px}
.pln-ps .ps-btn:hover:not(:disabled){background:#ffc20e;color:#06355f;filter:brightness(1.06)}
.pln-ps .ps-btn:disabled{background:#eef3f9;color:#8794a8}
.pln-ps .ps-err{border:0;border-radius:12px;display:flex;align-items:flex-start;gap:10px;text-align:left;font-size:.88rem}
.pln-ps .ps-or{display:flex;align-items:center;gap:10px;margin:20px 0 14px;font-size:.78rem;color:#8794a8}
.pln-ps .ps-or::before,.pln-ps .ps-or::after{content:"";flex:1;height:1px;background:#dbe5f1}
.pln-ps .form-select{background-color:#f6f9fc;border-color:#dbe5f1;border-radius:12px;padding:12px 14px}
.pln-ps .form-select:focus{border-color:#0b6bb8;box-shadow:0 0 0 3px rgba(11,107,184,.16)}
`;

const PengembalianScanForm = ({
  onScan,
  loading = false,
  error = null,
  peminjamOptions = [],
}: PengembalianScanFormProps) => {
  const [idCard, setIdCard] = useState("");

  // Global listener untuk RFID Scanner
  useBarcodeScanner({
    enabled: !loading,
    onScan: (scannedCode) => {
      setIdCard(scannedCode);
      onScan(scannedCode);
    },
    minLength: 4,
    maxGapMs: 40,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCard.trim()) return;
    onScan(idCard.trim());
  };

  return (
    <div className="pln-ps">
      <style>{CSS}</style>

      <div className="ps-ring">
        <IconId size={42} />
      </div>
      <h5>Tempelkan kartu peminjam</h5>
      <p className="ps-sub">
        Tap kartu ke <i>reader</i> untuk menampilkan alat yang sedang dipinjam. Jika reader tidak tersedia, pilih nama peminjam dari daftar.
      </p>

      {error && (
        <Alert variant="danger" className="ps-err">
          <IconAlertTriangle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <Form.Control
            type="password"
            autoComplete="off"
            placeholder="Atau ketik ID manual di sini..."
            aria-label="ID kartu peminjam"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={loading}
          />
          <Button className="ps-btn" type="submit" disabled={loading || !idCard.trim()}>
            <IconSearch size={18} />
            {loading ? "Mencari..." : "Cari"}
          </Button>
        </div>
      </Form>

      {/* Dropdown peminjam: cadangan jika reader RFID tidak tersedia */}
      <div className="ps-or">atau pilih dari daftar</div>
      <Form.Select
        aria-label="Pilih nama peminjam"
        value=""
        disabled={loading || peminjamOptions.length === 0}
        onChange={(e) => {
          if (e.target.value) onScan(e.target.value);
        }}
      >
        <option value="">
          {peminjamOptions.length === 0
            ? "Tidak ada peminjaman aktif"
            : "-- Pilih nama peminjam --"}
        </option>
        {peminjamOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nama}
          </option>
        ))}
      </Form.Select>
    </div>
  );
};

export default PengembalianScanForm;