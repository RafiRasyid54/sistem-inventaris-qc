"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  QrCode,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AlatUkur } from "../../types/DataAlatUkurTypes";

interface ColumnDefinitionProps {
  items: AlatUkur[];
  onDetail: (item: AlatUkur) => void;
  onEdit: (item: AlatUkur) => void;
  onDelete: (item: AlatUkur) => void;
  onAddToCart: (item: AlatUkur) => void;
  onDownloadQR: (kodeAlat: string) => void; // Prop baru untuk fungsi download dari parent
  canLoan?: boolean; // admin & petugas
  canEdit?: boolean; // admin & petugas
  canDelete?: boolean; // admin saja
}

// Kolom yang bisa diurutkan
type SortKey =
  | "nama_alat"
  | "merk"
  | "kode_alat"
  | "tanggal_kalibrasi_terakhir"
  | "tanggal_kalibrasi_selanjutnya"
  | "kondisi";

type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Daftar nomor halaman dengan titik-titik, contoh: 1 … 4 5 6 … 20
const getPageNumbers = (total: number, current: number): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
};

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
  onDownloadQR,
  canLoan = false,
  canEdit = false,
  canDelete = false,
}) => {
  // =======================================================
  // SORTING: klik header -> A-Z -> Z-A -> urutan asli
  // =======================================================
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // klik ketiga: kembali ke urutan asli
    });
  };

  const sortedItems = useMemo(() => {
    if (!sort) return items;

    // Nilai kosong atau "-" dianggap kosong dan selalu ditaruh paling bawah
    const getValue = (item: AlatUkur): string => {
      const raw = item[sort.key];
      const text = raw == null ? "" : String(raw).trim();
      return text === "-" ? "" : text;
    };

    return [...items].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);

      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;

      // numeric: true -> "3MMC2" tampil sebelum "3MMC10"
      const result = va.localeCompare(vb, "id", { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? result : -result;
    });
  }, [items, sort]);

  // =======================================================
  // PAGINATION (dilakukan setelah pengurutan)
  // =======================================================
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  // Kembali ke halaman 1 saat data (misalnya hasil pencarian), urutan, atau jumlah per halaman berubah
  useEffect(() => {
    setPage(1);
  }, [items, sort, pageSize]);

  const paginatedItems = useMemo(
    () => sortedItems.slice(offset, offset + pageSize),
    [sortedItems, offset, pageSize]
  );

  const startItem = totalItems === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + pageSize, totalItems);

  const renderSortableTh = (label: string, key: SortKey, minWidth: string) => {
    const active = sort?.key === key;
    const Icon = !active ? ArrowUpDown : sort?.dir === "asc" ? ArrowUp : ArrowDown;

    return (
      <th
        className="text-secondary small fw-semibold user-select-none"
        style={{ minWidth, cursor: "pointer" }}
        onClick={() => handleSort(key)}
        aria-sort={!active ? "none" : sort?.dir === "asc" ? "ascending" : "descending"}
        title={`Urutkan ${label}`}
      >
        <span className="d-inline-flex align-items-center gap-1">
          {label}
          <Icon
            size={13}
            className={active ? "text-primary" : "text-secondary opacity-50"}
          />
        </span>
      </th>
    );
  };

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

  return (
    <>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th className="text-secondary small fw-semibold" style={{ minWidth: "55px" }}>No</th>
            {renderSortableTh("Nama Alat Ukur", "nama_alat", "180px")}
            {renderSortableTh("Merk & Spesifikasi", "merk", "220px")}
            {renderSortableTh("Kode Nomor Alat Ukur", "kode_alat", "200px")}
            {renderSortableTh("Kalibrasi", "tanggal_kalibrasi_terakhir", "120px")}
            {renderSortableTh("Rencana Kalibrasi Berikutnya", "tanggal_kalibrasi_selanjutnya", "170px")}
            {renderSortableTh("Kondisi", "kondisi", "120px")}
            <th className="text-secondary small fw-semibold" style={{ minWidth: "180px" }}>Keterangan</th>
            <th className="text-secondary small fw-semibold text-center" style={{ minWidth: "140px" }}>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {paginatedItems.map((item, index) => (
            <tr key={item.id ?? index}>
              {/* NO (saat diurutkan, nomor mengikuti urutan tampil) */}
              <td className="text-secondary">
                {sort ? offset + index + 1 : item.no ?? offset + index + 1}
              </td>

              {/* NAMA ALAT */}
              <td>
                <div className="fw-semibold text-body">
                  {item.nama_alat || "-"}
                </div>
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
                  {canLoan && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost-primary"
                      onClick={() => onAddToCart(item)}
                      title="Pinjam alatukur"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  )}

                  {/* TOMBOL DOWNLOAD QR MEMANGGIL FUNGSI DARI PARENT */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-info"
                    onClick={() => onDownloadQR(item.kode_alat || item.sn || "UNKNOWN")}
                    title="Download QR Code alat ini"
                  >
                    <QrCode size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-secondary"
                    onClick={() => onDetail(item)}
                    title="Detail alatukur"
                  >
                    <Eye size={16} />
                  </button>

                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost-warning"
                      onClick={() => onEdit(item)}
                      title="Edit alatukur"
                    >
                      <Edit size={16} />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost-danger"
                      onClick={() => onDelete(item)}
                      title="Hapus alatukur"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {totalItems > 0 && (
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-top">
        <div className="d-flex flex-wrap align-items-center gap-2 text-secondary small">
          <span>Tampilkan</span>
          <select
            className="form-select form-select-sm w-auto"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Jumlah data per halaman"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per halaman</span>
          <span className="ms-md-2">
            Menampilkan {startItem}–{endItem} dari {totalItems} alatukur
          </span>
        </div>

        <nav aria-label="Navigasi halaman">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
            </li>

            {getPageNumbers(totalPages, currentPage).map((n, i) =>
              n === "ellipsis" ? (
                <li key={`ellipsis-${i}`} className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li key={n} className={`page-item ${n === currentPage ? "active" : ""}`}>
                  <button type="button" className="page-link" onClick={() => setPage(n)}>
                    {n}
                  </button>
                </li>
              )
            )}

            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    )}
    </>
  );
};