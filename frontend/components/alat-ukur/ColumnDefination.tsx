"use client";

import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  QrCode,
} from "lucide-react";

import { AlatUkur } from "../../types/DataAlatUkurTypes";

interface ColumnDefinitionProps {
  items: AlatUkur[];
  onDetail: (item: AlatUkur) => void;
  onEdit: (item: AlatUkur) => void;
  onDelete: (item: AlatUkur) => void;
  onAddToCart: (item: AlatUkur) => void;
}

// Helper untuk format tanggal "Bulan-Tahun"
const formatBulanTahun = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: '2-digit' }).format(date).replace(' ', '-');
};

export const ColumnDefinition: React.FC<ColumnDefinitionProps> = ({
  items,
  onDetail,
  onEdit,
  onDelete,
  onAddToCart,
}) => {
  const getKondisiClass = (kondisi?: string) => {
    switch (kondisi?.toLowerCase()) {
      case "baik":
        return "bg-success-subtle text-success";
      case "rpp":
        return "bg-warning-subtle text-warning-emphasis";
      case "rt":
        return "bg-danger-subtle text-danger";
      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const getKalibrasiClass = (rencana?: string) => {
    if (!rencana || rencana === '-') {
      return "bg-secondary-subtle text-secondary";
    }
    return "bg-primary-subtle text-primary";
  };

  // =======================================================
  // LOGIKA PINTAR UNTUK KATEGORI (Mekanik, Elektrik, Sipil)
  // =======================================================
  const getKategoriBadge = (item: AlatUkur) => {
    let kat = item.kategori;
    
    // Fallback cerdas: Jika kategori kosong dari DB, tebak dari kode alatnya
    if (!kat) {
       const kode = (item.kode_alat || "").toUpperCase();
       if (kode.includes("MMC")) kat = "Mekanik";
       else if (kode.includes("MHV") || kode.includes("MIT") || kode.includes("MTT") || kode.includes("MMT") || kode.includes("ELC")) kat = "Elektrik";
       else if (kode.includes("SSY") || kode.includes("SPC")) kat = "Sipil";
    }

    if (!kat) return null; // Jika masih tidak tahu, jangan tampilkan apa-apa

    let bgClass = "bg-secondary-subtle text-secondary";
    if (kat.toLowerCase() === "mekanik") bgClass = "bg-primary-subtle text-primary"; // Biru
    else if (kat.toLowerCase() === "elektrik") bgClass = "bg-warning-subtle text-warning-emphasis"; // Kuning
    else if (kat.toLowerCase() === "sipil") bgClass = "bg-info-subtle text-info"; // Biru Muda (Cyan)

    return (
      <span className={`badge rounded-pill ${bgClass} mt-1`} style={{ fontSize: '0.7rem' }}>
        {kat}
      </span>
    );
  };

  // =======================================================
  // DOWNLOAD QR CODE
  // =======================================================
  const handleDownloadQr = async (item: AlatUkur) => {
    const kode = item.kode_alat || item.sn || String(item.id ?? "");

    if (!kode) {
      alert("Alat ini belum memiliki kode_alat / SN untuk dijadikan QR Code.");
      return;
    }

    const size = 400;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      kode
    )}`;

    try {
      const response = await fetch(qrUrl);

      if (!response.ok) {
        throw new Error("Gagal mengambil gambar QR Code dari server.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${kode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal download QR code:", err);
      alert(
        "Gagal membuat/download QR Code. Pastikan koneksi internet aktif."
      );
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "55px" }}>No</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "180px" }}>Nama Alat Ukur</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "220px" }}>Merk & Spesifikasi</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "200px" }}>Kode Nomor Alat Ukur</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "120px" }}>Kalibrasi</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "170px" }}>Rencana Kalibrasi Berikutnya</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "120px" }}>Kondisi</th>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "180px" }}>Keterangan</th>
            <th className="text-secondary small fw-semibold text-center" style={{ minWidth: "180px" }}>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              {/* NO */}
              <td className="text-secondary">
                {item.no ?? index + 1}
              </td>

              {/* NAMA ALAT (Ditambah Label Kategori) */}
              <td>
                <div className="fw-semibold text-body">
                  {item.nama_alat || "-"}
                </div>
                
                {/* INI BAGIAN YANG MENAMPILKAN BADGE MEKANIK/ELEKTRIK/SIPIL */}
                <div>{getKategoriBadge(item)}</div>
                
                {item.lokasi && (
                  <small className="text-secondary d-block mt-1">
                    {item.lokasi}
                  </small>
                )}
              </td>

              {/* MERK & SPESIFIKASI */}
              <td>
                <div className="fw-semibold text-body">
                  {item.merk || "-"}
                </div>
                <div
                  className="text-secondary small mt-1"
                  style={{ maxWidth: "220px", whiteSpace: "normal" }}
                >
                  {item.spesifikasi || "-"}
                </div>
                {item.sn && (
                  <div className="mt-1">
                    <span className="text-secondary small">SN: </span>
                    <span className="font-monospace small">{item.sn}</span>
                  </div>
                )}
              </td>

              {/* KODE NOMOR ALAT UKUR */}
              <td>
                <div className="fw-semibold text-body">
                  {item.kode_alat || "-"}
                </div>
              </td>

              {/* KALIBRASI TERAKHIR */}
              <td>
                <span className={`badge rounded-pill ${getKalibrasiClass(item.tanggal_kalibrasi_terakhir)}`}>
                  {formatBulanTahun(item.tanggal_kalibrasi_terakhir)}
                </span>
              </td>

              {/* RENCANA KALIBRASI BERIKUTNYA */}
              <td>
                <span className={`badge rounded-pill ${getKalibrasiClass(item.tanggal_kalibrasi_selanjutnya)}`}>
                  {formatBulanTahun(item.tanggal_kalibrasi_selanjutnya)}
                </span>
              </td>

              {/* KONDISI */}
              <td>
                <span className={`badge rounded-pill ${getKondisiClass(item.kondisi)}`}>
                  {item.kondisi || "-"}
                </span>
              </td>

              {/* KETERANGAN */}
              <td>
                <div
                  className="text-secondary small"
                  style={{ maxWidth: "200px", whiteSpace: "normal" }}
                >
                  {item.keterangan || "-"}
                </div>
              </td>

              {/* AKSI */}
              <td>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-primary"
                    onClick={() => onAddToCart(item)}
                    title="Pinjam alat ukur"
                  >
                    <ShoppingCart size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-info"
                    onClick={() => handleDownloadQr(item)}
                    title="Download QR Code alat ini"
                  >
                    <QrCode size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-secondary"
                    onClick={() => onDetail(item)}
                    title="Detail alat ukur"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-warning"
                    onClick={() => onEdit(item)}
                    title="Edit alat ukur"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-danger"
                    onClick={() => onDelete(item)}
                    title="Hapus alat ukur"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};