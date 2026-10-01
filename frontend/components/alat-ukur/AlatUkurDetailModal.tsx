import React from 'react';
import { Modal, Badge } from 'react-bootstrap';
import { Info } from 'lucide-react';
import { AlatUkur } from '../../types/DataAlatUkurTypes';

interface AlatUkurDetailModalProps {
  item: AlatUkur | null;
  onClose: () => void;
}

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

export const AlatUkurDetailModal: React.FC<AlatUkurDetailModalProps> = ({ item, onClose }) => {
  // Render Badge Kondisi
  const getKondisiBadge = (kondisi?: string) => {
    const k = kondisi?.toLowerCase();
    if (k === 'baik') return <Badge bg="success-subtle" text="success">Baik</Badge>;
    if (k === 'rpp') return <Badge bg="warning-subtle" text="warning">RPP</Badge>;
    if (k === 'rt') return <Badge bg="danger-subtle" text="danger">RT</Badge>;
    return <Badge bg="secondary-subtle" text="secondary">{kondisi || '-'}</Badge>;
  };

  // Logika pintar untuk memisahkan kode alat berdasarkan teks
  const kodeAlat = item?.kode_alat || '';
  const isMekanik = kodeAlat.includes('MM');
  const isElektrik = kodeAlat.includes('EL');
  const isSipil = kodeAlat.includes('SP');

  return (
    <Modal 
      show={!!item} 
      onHide={onClose} 
      centered 
      backdrop="static"
      size="lg"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fs-5 fw-bold text-dark d-flex align-items-center gap-2">
          <Info size={20} className="text-primary"/> Detail Alat Ukur
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="bg-light pb-4">
        {item && (
          <div className="bg-white p-4 rounded border shadow-sm mt-2">
            {/* Bagian Header Detail */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h3 className="fw-bold text-dark mb-1">{item.nama_alat}</h3>
                <p className="font-monospace text-primary fw-semibold mb-0">
                  {kodeAlat || "Tanpa Kode"}
                </p>
              </div>
              <div>{getKondisiBadge(item.kondisi)}</div>
            </div>

            {/* Spesifikasi Grid */}
            <div className="row g-3 border-top pt-3">
              {/* Baris 1: Spesifikasi Dasar */}
              <div className="col-md-4 col-sm-6">
                <span className="text-secondary small d-block mb-1">Merk</span>
                <span className="fw-semibold text-dark">{item.merk || '-'}</span>
              </div>
              <div className="col-md-4 col-sm-6">
                <span className="text-secondary small d-block mb-1">Serial Number (SN)</span>
                <span className="fw-semibold text-dark">{item.sn || '-'}</span>
              </div>
              <div className="col-md-4 col-sm-6">
                <span className="text-secondary small d-block mb-1">Spesifikasi</span>
                <span className="fw-semibold text-dark">{item.spesifikasi || '-'}</span>
              </div>

              {/* Baris 2: Pembagian Kode (Smart Logic) */}
              <div className="col-md-4 col-sm-6 mt-3">
                <span className="text-secondary small d-block mb-1">Kode Mekanik</span>
                <span className="fw-semibold text-dark">{isMekanik ? kodeAlat : '-'}</span>
              </div>
              <div className="col-md-4 col-sm-6 mt-3">
                <span className="text-secondary small d-block mb-1">Kode Elektrik</span>
                <span className="fw-semibold text-dark">{isElektrik ? kodeAlat : '-'}</span>
              </div>
              <div className="col-md-4 col-sm-6 mt-3">
                <span className="text-secondary small d-block mb-1">Kode Sipil</span>
                <span className="fw-semibold text-dark">{isSipil ? kodeAlat : '-'}</span>
              </div>

              {/* Baris 3: Lokasi & Keterangan */}
              <div className="col-md-6 col-sm-12 mt-3">
                <span className="text-secondary small d-block mb-1">Lokasi</span>
                <span className="fw-semibold text-dark">{item.lokasi || '-'}</span>
              </div>
              <div className="col-md-6 col-sm-12 mt-3">
                <span className="text-secondary small d-block mb-1">Keterangan</span>
                <span className="fw-semibold text-dark">{item.keterangan || '-'}</span>
              </div>

              {/* Baris 4: Jadwal Kalibrasi (Membaca API Laravel yang benar) */}
              <div className="col-md-6 col-sm-12 mt-4">
                <div className="bg-light p-2 rounded border border-secondary-subtle">
                  <span className="text-secondary small d-block mb-1">Kalibrasi Terakhir</span>
                  {/* Gunakan item.tanggal_kalibrasi_terakhir dari API */}
                  <span className="fw-semibold text-primary">
                    {formatBulanTahun(item.tanggal_kalibrasi_terakhir as string)}
                  </span>
                </div>
              </div>
              <div className="col-md-6 col-sm-12 mt-4">
                <div className="bg-light p-2 rounded border border-secondary-subtle">
                  <span className="text-secondary small d-block mb-1">Rencana Kalibrasi Berikutnya</span>
                  {/* Gunakan item.tanggal_kalibrasi_selanjutnya dari API */}
                  <span className="fw-semibold text-danger">
                    {formatBulanTahun(item.tanggal_kalibrasi_selanjutnya as string)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};