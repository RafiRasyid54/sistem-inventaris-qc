import React from 'react';
import { Modal } from 'react-bootstrap';
import { IconInfoCircle, IconCalendarCheck, IconCalendarEvent } from '@tabler/icons-react';
import { AlatUkur } from '../../types/DataAlatUkurTypes';

interface AlatUkurDetailModalProps {
  item: AlatUkur | null;
  onClose: () => void;
}

// Alat dianggap "mendekati" kalibrasi bila sisa hari <= angka ini.
const BATAS_MENDEKATI_HARI = 30;

// Fungsi untuk memformat tanggal YYYY-MM-DD menjadi "Bulan-Tahun" seperti di Excel
const formatBulanTahun = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: '2-digit'
  }).format(date).replace(' ', '-'); // Contoh output: "November-25"
};

// Sisa hari menuju tanggal kalibrasi berikutnya -> label + warna status
const statusKalibrasi = (dateString?: string) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const selisih = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (selisih < 0) return { text: `Terlambat ${Math.abs(selisih)} hari`, cls: 'bad' };
  if (selisih === 0) return { text: 'Jatuh tempo hari ini', cls: 'bad' };
  if (selisih <= BATAS_MENDEKATI_HARI) return { text: `${selisih} hari lagi`, cls: 'warn' };
  return { text: `${selisih} hari lagi`, cls: 'ok' };
};

const CSS = `
.pln-modal-backdrop.modal-backdrop{--bs-backdrop-bg:#041f38;--bs-backdrop-opacity:.68;backdrop-filter:blur(3px)}
.pln-detail{border:0!important;border-radius:20px!important;overflow:hidden}
.pln-detail .pd-hero{position:relative;padding:22px 26px 20px;color:#fff;
  background:linear-gradient(115deg,#06355f 0%,#0b6bb8 70%,#00a7c4 140%)}
.pln-detail .pd-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;
  background:linear-gradient(90deg,#ffc20e 0 55%,#e2231a 55% 70%,#00a7c4 70%)}
.pln-detail .pd-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.pln-detail .pd-lb{font-size:.74rem;color:#cfe3f6;display:flex;align-items:center;gap:6px;margin-bottom:6px}
.pln-detail .pd-name{font-size:1.5rem;font-weight:800;margin:0;line-height:1.2;color:#fff}
.pln-detail .pd-code{display:inline-block;margin-top:10px;font-family:ui-monospace,Menlo,monospace;font-weight:700;
  font-size:.85rem;background:rgba(255,255,255,.16);padding:3px 10px;border-radius:8px}
.pln-detail .pd-close{border:0;background:rgba(255,255,255,.14);color:#fff;width:34px;height:34px;border-radius:10px;
  font-size:1.1rem;line-height:1;cursor:pointer;flex:none}
.pln-detail .pd-close:hover{background:rgba(255,255,255,.26)}
.pln-detail .pd-pill{display:inline-block;font-size:.76rem;font-weight:700;padding:4px 12px;border-radius:99px}
.pln-detail .pill-ok{background:#dcf4ea;color:#0b7a50}
.pln-detail .pill-warn{background:#fff0c2;color:#7a5500}
.pln-detail .pill-bad{background:#fde1df;color:#a8160f}
.pln-detail .pill-neutral{background:#eef3f9;color:#06355f}

.pln-detail .pd-body{padding:22px 26px 8px;background:#fff}
.pln-detail .pd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 20px}
.pln-detail .pd-grid .wide{grid-column:span 3}
.pln-detail .pd-k{font-size:.74rem;color:#62708a;display:block;margin-bottom:2px}
.pln-detail .pd-v{font-weight:600;color:#14233b;overflow-wrap:anywhere}

.pln-detail .pd-cal{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:6px 26px 8px;background:#fff}
.pln-detail .pd-calc{border:1px solid #dbe5f1;border-radius:14px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start}
.pln-detail .pd-calc .ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex:none}
.pln-detail .ic-last{background:#e6f0fa;color:#0b6bb8}
.pln-detail .ic-next.ok{background:#dcf4ea;color:#0b7a50}
.pln-detail .ic-next.warn{background:#fff0c2;color:#9a6a00}
.pln-detail .ic-next.bad{background:#fde1df;color:#a8160f}
.pln-detail .ic-next.none{background:#eef3f9;color:#62708a}
.pln-detail .pd-date{font-weight:800;font-size:1.05rem;color:#06355f}

.pln-detail .pd-foot{padding:16px 26px 22px;background:#fff;display:flex;justify-content:flex-end}
.pln-detail .pd-btn{border:0;border-radius:11px;padding:9px 22px;font-weight:700;font-size:.9rem;background:#eef3f9;color:#06355f;cursor:pointer}
.pln-detail .pd-btn:hover{background:#e0e9f4}
.pln-detail button:focus-visible{outline:2px solid #ffc20e;outline-offset:2px}
@media (max-width:575px){.pln-detail .pd-grid{grid-template-columns:1fr 1fr}.pln-detail .pd-grid .wide{grid-column:span 2}
  .pln-detail .pd-cal{grid-template-columns:1fr}}
`;

export const AlatUkurDetailModal: React.FC<AlatUkurDetailModalProps> = ({ item, onClose }) => {
  // Render Badge Kondisi
  const getKondisiBadge = (kondisi?: string) => {
    const k = kondisi?.toLowerCase();
    if (k === 'baik') return <span className="pd-pill pill-ok">Baik</span>;
    if (k === 'rpp') return <span className="pd-pill pill-warn">RPP</span>;
    if (k === 'rt') return <span className="pd-pill pill-bad">RT</span>;
    return <span className="pd-pill pill-neutral">{kondisi || '-'}</span>;
  };

  // Logika pintar untuk menentukan bidang berdasarkan teks kode alat
  const kodeAlat = item?.kode_alat || '';
  const isMekanik = kodeAlat.includes('MM');
  const isElektrik = kodeAlat.includes('EL');
  const isSipil = kodeAlat.includes('SP');
  const bidang = isMekanik ? 'Mekanik' : isElektrik ? 'Elektrik' : isSipil ? 'Sipil' : (item as any)?.kategori || '-';

  const status = statusKalibrasi(item?.tanggal_kalibrasi_selanjutnya as string);

  return (
    <>
      <style>{CSS}</style>
      <Modal
        show={!!item}
        onHide={onClose}
        centered
        backdrop="static"
        size="lg"
        backdropClassName="pln-modal-backdrop"
        contentClassName="pln-detail"
      >
        {item && (
          <>
            <div className="pd-hero">
              <div className="pd-top">
                <div>
                  <div className="pd-lb"><IconInfoCircle size={14} /> Detail alat ukur</div>
                  <h3 className="pd-name">{item.nama_alat}</h3>
                  <span className="pd-code">{kodeAlat || 'Tanpa Kode'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {getKondisiBadge(item.kondisi)}
                  <button type="button" className="pd-close" onClick={onClose} aria-label="Tutup">×</button>
                </div>
              </div>
            </div>

            <div className="pd-body">
              <div className="pd-grid">
                <div>
                  <span className="pd-k">Merk</span>
                  <span className="pd-v">{item.merk || '-'}</span>
                </div>
                <div>
                  <span className="pd-k">Serial Number (SN)</span>
                  <span className="pd-v">{item.sn || '-'}</span>
                </div>
                <div>
                  <span className="pd-k">Bidang</span>
                  <span className="pd-v">{bidang}</span>
                </div>

                <div className="wide">
                  <span className="pd-k">Spesifikasi</span>
                  <span className="pd-v">{item.spesifikasi || '-'}</span>
                </div>

                <div>
                  <span className="pd-k">Lokasi</span>
                  <span className="pd-v">{item.lokasi || '-'}</span>
                </div>
                <div className="wide" style={{ gridColumn: 'span 2' }}>
                  <span className="pd-k">Keterangan</span>
                  <span className="pd-v">{item.keterangan || '-'}</span>
                </div>
              </div>
            </div>

            <div className="pd-cal" style={{ paddingTop: 18 }}>
              <div className="pd-calc">
                <span className="ic ic-last"><IconCalendarCheck size={20} /></span>
                <div>
                  <span className="pd-k">Kalibrasi terakhir</span>
                  <span className="pd-date">
                    {formatBulanTahun(item.tanggal_kalibrasi_terakhir as string)}
                  </span>
                </div>
              </div>
              <div className="pd-calc">
                <span className={`ic ic-next ${status?.cls ?? 'none'}`}><IconCalendarEvent size={20} /></span>
                <div>
                  <span className="pd-k">Rencana kalibrasi berikutnya</span>
                  <span className="pd-date">
                    {formatBulanTahun(item.tanggal_kalibrasi_selanjutnya as string)}
                  </span>
                  {status && (
                    <div className="mt-1">
                      <span className={`pd-pill pill-${status.cls}`}>{status.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pd-foot">
              <button type="button" className="pd-btn" onClick={onClose}>Tutup</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};