"use client";

import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
} from "lucide-react";

import { AlatUkur } from "../../types/DataAlatUkurTypes";

interface ColumnDefinitionProps {
  items: AlatUkur[];
  onDetail: (item: AlatUkur) => void;
  onEdit: (item: AlatUkur) => void;
  onDelete: (item: AlatUkur) => void;
  onAddToCart: (item: AlatUkur) => void;
}

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
    if (!rencana) {
      return "bg-secondary-subtle text-secondary";
    }

    return "bg-primary-subtle text-primary";
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "55px" }}
            >
              No
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "180px" }}
            >
              Nama Alat Ukur
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "220px" }}
            >
              Merk & Spesifikasi
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "200px" }}
            >
              Kode Nomor Alat Ukur
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "120px" }}
            >
              Kalibrasi
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "170px" }}
            >
              Rencana Kalibrasi Berikutnya
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "120px" }}
            >
              Kondisi
            </th>

            <th
              className="text-secondary small fw-semibold"
              style={{ minWidth: "180px" }}
            >
              Keterangan
            </th>

            <th
              className="text-secondary small fw-semibold text-center"
              style={{ minWidth: "150px" }}
            >
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              {/* NO */}
              <td className="text-secondary">
                {item.no ?? index + 1}
              </td>

              {/* NAMA ALAT */}
              <td>
                <div className="fw-semibold text-body">
                  {item.nama_alat || "-"}
                </div>

                {item.lokasi && (
                  <small className="text-secondary">
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
                  style={{
                    maxWidth: "220px",
                    whiteSpace: "normal",
                  }}
                >
                  {item.spesifikasi || "-"}
                </div>

                {item.sn && (
                  <div className="mt-1">
                    <span className="text-secondary small">
                      SN:{" "}
                    </span>

                    <span className="font-monospace small">
                      {item.sn}
                    </span>
                  </div>
                )}
              </td>

              {/* KODE NOMOR ALAT UKUR */}
              <td>
                <div className="d-flex flex-column gap-1">
                  {item.kode_mekanik && (
                    <div className="small">
                      <span className="text-secondary">
                        Mekanik:
                      </span>{" "}
                      <span className="fw-semibold">
                        {item.kode_mekanik}
                      </span>
                    </div>
                  )}

                  {item.kode_elektrik && (
                    <div className="small">
                      <span className="text-secondary">
                        Elektrik:
                      </span>{" "}
                      <span className="fw-semibold">
                        {item.kode_elektrik}
                      </span>
                    </div>
                  )}

                  {item.kode_sipil && (
                    <div className="small">
                      <span className="text-secondary">
                        Sipil:
                      </span>{" "}
                      <span className="fw-semibold">
                        {item.kode_sipil}
                      </span>
                    </div>
                  )}

                  {!item.kode_mekanik &&
                    !item.kode_elektrik &&
                    !item.kode_sipil && (
                      <span className="text-secondary">
                        -
                      </span>
                    )}
                </div>
              </td>

              {/* KALIBRASI */}
              <td>
                <span
                  className={`badge rounded-pill ${getKalibrasiClass(
                    item.kalibrasi
                  )}`}
                >
                  {item.kalibrasi || "-"}
                </span>
              </td>

              {/* RENCANA KALIBRASI */}
              <td>
                <span
                  className={`badge rounded-pill ${getKalibrasiClass(
                    item.rencana_kalibrasi
                  )}`}
                >
                  {item.rencana_kalibrasi || "-"}
                </span>
              </td>

              {/* KONDISI */}
              <td>
                <span
                  className={`badge rounded-pill ${getKondisiClass(
                    item.kondisi
                  )}`}
                >
                  {item.kondisi || "-"}
                </span>
              </td>

              {/* KETERANGAN */}
              <td>
                <div
                  className="text-secondary small"
                  style={{
                    maxWidth: "200px",
                    whiteSpace: "normal",
                  }}
                >
                  {item.keterangan || "-"}
                </div>
              </td>

              {/* AKSI */}
              <td>
                <div className="d-flex align-items-center justify-content-center gap-1">
                  {/* PINJAM */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-primary"
                    onClick={() => onAddToCart(item)}
                    title="Pinjam alat ukur"
                    aria-label={`Pinjam ${item.nama_alat}`}
                  >
                    <ShoppingCart size={16} />
                  </button>

                  {/* DETAIL */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-secondary"
                    onClick={() => onDetail(item)}
                    title="Detail alat ukur"
                    aria-label={`Detail ${item.nama_alat}`}
                  >
                    <Eye size={16} />
                  </button>

                  {/* EDIT */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-warning"
                    onClick={() => onEdit(item)}
                    title="Edit alat ukur"
                    aria-label={`Edit ${item.nama_alat}`}
                  >
                    <Edit size={16} />
                  </button>

                  {/* DELETE */}
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-danger"
                    onClick={() => onDelete(item)}
                    title="Hapus alat ukur"
                    aria-label={`Hapus ${item.nama_alat}`}
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