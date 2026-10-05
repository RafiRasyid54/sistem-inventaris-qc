"use client";
// import node module libraries
import { Modal } from "react-bootstrap";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}
const DetailRow = ({ label, value }: DetailRowProps) => (
  <div>
    <span className="dl-k">{label}</span>
    <span className="dl-v">{value || "-"}</span>
  </div>
);

interface DetailLaporanModalProps {
  show: boolean;
  onClose: () => void;
  item: LaporanKerusakanType | null;
}

// Gaya modal detail laporan (tema PLN). Semua selector diawali .pln-dl.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-dl{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-dl .dl-hero{position:relative;padding:22px 26px 20px;color:#fff;
  background:linear-gradient(115deg,#06355f 0%,#0b6bb8 70%,#00a7c4 140%)}
.pln-dl .dl-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;
  background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-dl .dl-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.pln-dl .dl-lb{font-size:.74rem;color:#cfe3f6;display:flex;align-items:center;gap:6px;margin-bottom:6px}
.pln-dl .dl-name{font-size:1.5rem;font-weight:800;margin:0;line-height:1.2;color:#fff}
.pln-dl .dl-code{display:inline-block;margin-top:10px;font-family:ui-monospace,Menlo,monospace;font-weight:700;
  font-size:.85rem;background:rgba(255,255,255,.16);padding:3px 10px;border-radius:8px}
.pln-dl .dl-close{border:0;background:rgba(255,255,255,.14);color:#fff;width:34px;height:34px;border-radius:10px;
  font-size:1.1rem;line-height:1;cursor:pointer;flex:none}
.pln-dl .dl-close:hover{background:rgba(255,255,255,.26)}
.pln-dl .dl-pill{display:inline-flex;align-items:center;gap:5px;font-size:.76rem;font-weight:700;padding:4px 12px;border-radius:99px}
.pln-dl .pill-ok{background:#dcf4ea;color:#0b7a50}
.pln-dl .pill-bad{background:#fde1df;color:#a8160f}

.pln-dl .dl-body{padding:22px 26px 8px;background:#fff}
.pln-dl .dl-sec{font-size:.78rem;font-weight:700;color:#0b6bb8;display:flex;align-items:center;gap:10px;margin:0 0 12px}
.pln-dl .dl-sec::after{content:"";flex:1;height:1px;background:#dbe5f1}
.pln-dl .dl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px;margin-bottom:22px}
.pln-dl .dl-k{font-size:.74rem;color:#62708a;display:block;margin-bottom:2px}
.pln-dl .dl-v{font-weight:600;color:#14233b;overflow-wrap:anywhere}
.pln-dl .dl-note{background:#f6f9fc;border:1px solid #dbe5f1;border-radius:12px;padding:12px 14px;margin:0 0 16px;
  color:#14233b;overflow-wrap:anywhere}

.pln-dl .dl-foot{padding:16px 26px 22px;background:#fff;display:flex;justify-content:flex-end}
.pln-dl .dl-btn{border:0;border-radius:11px;padding:9px 22px;font-weight:700;font-size:.9rem;background:#eef3f9;color:#06355f;cursor:pointer}
.pln-dl .dl-btn:hover{background:#e0e9f4}
.pln-dl button:focus-visible{outline:2px solid #ffc20e;outline-offset:2px}
@media (max-width:575px){.pln-dl .dl-grid{grid-template-columns:1fr}}
`;

const DetailLaporanModal = ({ show, onClose, item }: DetailLaporanModalProps) => {
  if (!item) return null;

  const isFixed = item.status === "selesai_diperbaiki";

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={show}
        onHide={onClose}
        centered
        size="lg"
        backdrop="static"
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-dl"
        className="detail-laporan-modal"
      >
        {/* Hero: nama barang + kode + jumlah rusak */}
        <div className="dl-hero">
          <div className="dl-top">
            <div>
              <div className="dl-lb">
                <IconAlertTriangle size={14} /> Detail laporan kerusakan
              </div>
              <h3 className="dl-name">{item.nama_barang}</h3>
              <span className="dl-code">{item.kode_barang || "Tanpa Kode"}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className={`dl-pill ${isFixed ? "pill-ok" : "pill-bad"}`}>
                {isFixed ? <IconCircleCheck size={14} /> : <IconAlertTriangle size={14} />}
                {item.jumlah_rusak} unit {isFixed ? "diperbaiki" : "rusak"}
              </span>
              <button type="button" className="dl-close" onClick={onClose} aria-label="Tutup">×</button>
            </div>
          </div>
        </div>

        <div className="dl-body">
          {/* Spesifikasi alat */}
          <div className="dl-sec">Spesifikasi alat</div>
          <div className="dl-grid">
            <DetailRow label="Merk" value={item.merk} />
            <DetailRow label="Tipe" value={item.tipe} />
            <DetailRow label="Warna" value={item.warna} />
            <DetailRow label="Ukuran" value={item.ukuran} />
          </div>

          {/* Informasi pengembalian */}
          <div className="dl-sec">Informasi pengembalian</div>
          <div className="dl-grid">
            <DetailRow label="Tgl & Jam Pengembalian" value={item.tanggal_pengembalian} />
            <DetailRow label="Nama Peminjam" value={item.nama_peminjam} />
            <DetailRow label="Divisi" value={item.divisi} />
            <DetailRow label="Nama Pekerjaan" value={item.nama_pekerjaan} />
            <DetailRow label="Area Kerja" value={item.area_kerja} />
          </div>

          {/* Keterangan */}
          <div className="dl-sec">Keterangan</div>
          <p className="dl-note">{item.keterangan || "-"}</p>
        </div>

        <div className="dl-foot">
          <button type="button" className="dl-btn" onClick={onClose}>Tutup</button>
        </div>
      </Modal>
    </>
  );
};

export default DetailLaporanModal;