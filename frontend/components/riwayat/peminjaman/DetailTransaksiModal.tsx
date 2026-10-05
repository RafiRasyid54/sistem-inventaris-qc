"use client";
// import node module libraries
import { Modal, Table } from "react-bootstrap";
import { IconFileInvoice, IconCalendarCheck, IconCalendarEvent } from "@tabler/icons-react";

// import custom types
import { RiwayatPeminjamanType } from "types/RiwayatTypes";

interface DetailTransaksiModalProps {
  show: boolean;
  onClose: () => void;
  items: RiwayatPeminjamanType[]; // semua baris dengan nomor_transaksi yang sama
}

// Gaya modal detail transaksi (tema PLN). Semua selector diawali .pln-dt.
const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-dt{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-dt .dt-hero{position:relative;padding:22px 26px 20px;color:#fff;
  background:linear-gradient(115deg,#06355f 0%,#0b6bb8 70%,#00a7c4 140%)}
.pln-dt .dt-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;
  background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-dt .dt-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.pln-dt .dt-lb{font-size:.74rem;color:#cfe3f6;display:flex;align-items:center;gap:6px;margin-bottom:6px}
.pln-dt .dt-name{font-size:1.5rem;font-weight:800;margin:0;line-height:1.2;color:#fff}
.pln-dt .dt-sub{margin-top:6px;font-size:.85rem;color:#cfe3f6}
.pln-dt .dt-sub b{color:#fff;font-weight:700}
.pln-dt .dt-close{border:0;background:rgba(255,255,255,.14);color:#fff;width:34px;height:34px;border-radius:10px;
  font-size:1.1rem;line-height:1;cursor:pointer;flex:none}
.pln-dt .dt-close:hover{background:rgba(255,255,255,.26)}
.pln-dt .dt-pill{display:inline-block;font-size:.76rem;font-weight:700;padding:4px 12px;border-radius:99px;
  background:#ffc20e;color:#06355f}

.pln-dt .dt-body{padding:22px 26px 8px;background:#fff}
.pln-dt .dt-sec{font-size:.78rem;font-weight:700;color:#0b6bb8;display:flex;align-items:center;gap:10px;margin:0 0 12px}
.pln-dt .dt-sec::after{content:"";flex:1;height:1px;background:#dbe5f1}
.pln-dt .dt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 20px;margin-bottom:22px}
.pln-dt .dt-k{font-size:.74rem;color:#62708a;display:block;margin-bottom:2px}
.pln-dt .dt-v{font-weight:600;color:#14233b;overflow-wrap:anywhere}

.pln-dt .dt-cal{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
.pln-dt .dt-calc{border:1px solid #dbe5f1;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start}
.pln-dt .dt-calc .ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex:none}
.pln-dt .ic-out{background:#e6f0fa;color:#0b6bb8}
.pln-dt .ic-in{background:#dcf4ea;color:#0b7a50}
.pln-dt .dt-date{font-weight:800;font-size:1.05rem;color:#06355f}

.pln-dt .dt-tbl{border:1px solid #dbe5f1;border-radius:14px;overflow:hidden}
.pln-dt .dt-table{margin:0}
.pln-dt .dt-table thead th{background:#eef3f9;color:#06355f;font-size:.74rem;font-weight:700;white-space:nowrap;
  border-bottom:1px solid #dbe5f1}
.pln-dt .dt-table td{font-size:.85rem;color:#14233b;border-color:#eef3f9}
.pln-dt .dt-table tbody tr:hover>*{background:#f6f9fc}
.pln-dt .dt-code{font-family:ui-monospace,Menlo,monospace;font-weight:700;color:#06355f}

.pln-dt .dt-foot{padding:16px 26px 22px;background:#fff;display:flex;justify-content:flex-end}
.pln-dt .dt-btn{border:0;border-radius:11px;padding:9px 22px;font-weight:700;font-size:.9rem;background:#eef3f9;color:#06355f;cursor:pointer}
.pln-dt .dt-btn:hover{background:#e0e9f4}
.pln-dt button:focus-visible{outline:2px solid #ffc20e;outline-offset:2px}
@media (max-width:575px){.pln-dt .dt-grid{grid-template-columns:1fr}.pln-dt .dt-cal{grid-template-columns:1fr}}
`;

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="dt-k">{label}</span>
    <span className="dt-v">{value || "-"}</span>
  </div>
);

const DetailTransaksiModal = ({
  show,
  onClose,
  items,
}: DetailTransaksiModalProps) => {
  if (items.length === 0) return null;
  const header = items[0];

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
        contentClassName="pln-dt"
        className="detail-transaksi-modal"
      >
        {/* Hero: peminjam + jumlah item */}
        <div className="dt-hero">
          <div className="dt-top">
            <div>
              <div className="dt-lb">
                <IconFileInvoice size={14} /> Detail transaksi
              </div>
              <h3 className="dt-name">{header.nama_peminjam}</h3>
              <div className="dt-sub">
                Divisi: <b>{header.divisi || "-"}</b>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="dt-pill">{items.length} jenis barang</span>
              <button type="button" className="dt-close" onClick={onClose} aria-label="Tutup">×</button>
            </div>
          </div>
        </div>

        <div className="dt-body">
          {/* Informasi transaksi */}
          <div className="dt-sec">Informasi transaksi</div>
          <div className="dt-grid">
            <InfoItem label="Nama Pekerjaan" value={header.nama_pekerjaan} />
            <InfoItem label="Area Kerja" value={header.area_kerja} />
            <InfoItem label="Nama Peminjam" value={header.nama_peminjam} />
          </div>

          {/* Tanggal pinjam & kembali */}
          <div className="dt-cal">
            <div className="dt-calc">
              <span className="ic ic-out"><IconCalendarEvent size={20} /></span>
              <div>
                <span className="dt-k">Tanggal pinjam</span>
                <span className="dt-date">{header.tanggal_pinjam || "-"}</span>
              </div>
            </div>
            <div className="dt-calc">
              <span className="ic ic-in"><IconCalendarCheck size={20} /></span>
              <div>
                <span className="dt-k">Tanggal kembali</span>
                <span className="dt-date">{header.tanggal_kembali || "-"}</span>
              </div>
            </div>
          </div>

          {/* Daftar barang */}
          <div className="dt-sec">Daftar barang</div>
          <div className="dt-tbl mb-3">
            <div className="table-responsive">
              <Table size="sm" className="align-middle dt-table detail-transaksi-table">
                <thead>
                  <tr>
                    <th>Kode Barang</th>
                    <th>Nama Barang</th>
                    <th>Merk</th>
                    <th>Tipe</th>
                    <th>Warna</th>
                    <th>Ukuran</th>
                    <th className="text-center">Jumlah</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="dt-code">{item.kode_barang}</td>
                      <td>{item.nama_barang}</td>
                      <td>{item.merk}</td>
                      <td>{item.tipe}</td>
                      <td>{item.warna}</td>
                      <td>{item.ukuran}</td>
                      <td className="text-center fw-semibold">{item.jumlah}</td>
                      <td className="text-secondary small">
                        {item.keterangan || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        <div className="dt-foot">
          <button type="button" className="dt-btn" onClick={onClose}>Tutup</button>
        </div>
      </Modal>
    </>
  );
};

export default DetailTransaksiModal;