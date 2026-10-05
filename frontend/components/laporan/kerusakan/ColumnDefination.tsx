"use client";
// import node module libraries
import { CSSProperties } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

// import custom types
import { LaporanKerusakanType } from "types/LaporanKerusakanTypes";

// import custom components
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  canProcess?: boolean;
  onDetail: (item: LaporanKerusakanType) => void;
  onRepair: (item: LaporanKerusakanType) => void;
  onTandaiPermanen: (item: LaporanKerusakanType) => void; 
}

// Gaya pill tema PLN (inline, sama dengan palet pill di modal detail)
const pillBase: CSSProperties = {
  display: "inline-block",
  fontSize: ".76rem",
  fontWeight: 700,
  padding: "4px 12px",
  borderRadius: 99,
  whiteSpace: "nowrap",
};

const PILL = {
  ok: { background: "#dcf4ea", color: "#0b7a50" },
  warn: { background: "#fff0c2", color: "#7a5500" },
  bad: { background: "#fde1df", color: "#a8160f" },
  neutral: { background: "#eef3f9", color: "#06355f" },
} satisfies Record<string, CSSProperties>;

const STATUS_CONFIG: Record<string, { tone: keyof typeof PILL; label: string }> = {
  bisa_diperbaiki: { tone: "warn", label: "Bisa Diperbaiki" },
  rusak_permanen: { tone: "bad", label: "Rusak Permanen" },
  selesai_diperbaiki: { tone: "ok", label: "Sudah Diperbaiki" },
  rusak: { tone: "bad", label: "Rusak Permanen" },
};

export const getLaporanKerusakanColumns = ({
  canProcess = false,
  onDetail,
  onRepair,
  onTandaiPermanen,
}: ColumnHandlers): ColumnDef<LaporanKerusakanType>[] => [
  {
    accessorKey: "tanggal_pengembalian",
    header: "Tgl & Jam Pengembalian",
  },
  {
    accessorKey: "kode_barang",
    header: "Kode Barang",
    cell: ({ row }) => {
      const kode = row.original.kode_barang;
      const kosong = !kode || kode === "-";

      return kosong ? (
        <span style={{ color: "#8794a8" }}>-</span>
      ) : (
        <span
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontWeight: 700,
            color: "#06355f",
          }}
        >
          {kode}
        </span>
      );
    },
  },
  {
    accessorKey: "nama_barang",
    header: "Nama Barang",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = STATUS_CONFIG[status] ?? { tone: "neutral" as const, label: status };

      return (
        <span style={{ ...pillBase, ...PILL[config.tone] }}>
          {config.label}
        </span>
      );
    },
  },
  {
    accessorKey: "merk",
    header: "Merk",
  },
  {
    accessorKey: "tipe",
    header: "Tipe",
  },
  {
    accessorKey: "warna",
    header: "Warna",
  },
  {
    accessorKey: "ukuran",
    header: "Ukuran",
  },
  {
    accessorKey: "jumlah_rusak",
    header: "Jumlah Rusak",
    cell: ({ row }) => {
      const jumlah = row.original.jumlah_rusak as number | string | null | undefined;
      const kosong = jumlah === null || jumlah === undefined || jumlah === "";

      return (
        <span className="d-flex justify-content-center">
          {kosong ? (
            <span style={{ color: "#8794a8" }}>-</span>
          ) : (
            <span style={{ ...pillBase, ...PILL.bad, minWidth: 34, textAlign: "center" }}>
              {jumlah}
            </span>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "nama_peminjam",
    header: "Nama Peminjam",
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
  },
  {
    accessorKey: "nama_pekerjaan",
    header: "Nama Pekerjaan",
  },
  {
    accessorKey: "area_kerja",
    header: "Area Kerja",
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const text = row.original.keterangan;
      const truncated = text.length > 30 ? `${text.slice(0, 30)}...` : text;
      return (
        <span
          title={text || undefined}
          style={{ fontSize: ".8rem", color: "#62708a" }}
        >
          {truncated || "-"}
        </span>
      );
    },
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      const bisaDiperbaiki = item.status === "bisa_diperbaiki";

      return (
        <ActionMenu
          toggleButton={<IconDotsVertical size={20} style={{ color: "#06355f" }} />}
          className="btn btn-ghost btn-icon btn-sm rounded-circle"
          drop="start"
          align="start"
        >
          <Dropdown.Item onClick={() => onDetail(item)}>
            Detail Laporan
          </Dropdown.Item>
          {canProcess && bisaDiperbaiki && (
            <>
              <Dropdown.Item
                className="text-success"
                style={{ fontWeight: 600 }}
                onClick={() => onRepair(item)}
              >
                Repair Alat
              </Dropdown.Item>
              <Dropdown.Item
                className="text-danger"
                style={{ fontWeight: 600 }}
                onClick={() => onTandaiPermanen(item)}
              >
                Tandai Rusak Permanen
              </Dropdown.Item>
            </>
          )}
        </ActionMenu>
      );
    },
  },
];