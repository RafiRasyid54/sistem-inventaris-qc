// components/peminjamanaktif/ColumnDefination.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { IconEye } from "@tabler/icons-react";
import { PeminjamanAktifItemType } from "types/DataAlatUkurTypes";

const statusVariant = (status?: string) => {
  switch (status) {
    case "dipinjam":
      return { bg: "warning-subtle", text: "warning-emphasis" };
    case "selesai":
      return { bg: "success-subtle", text: "success-emphasis" };
    default:
      return { bg: "secondary-subtle", text: "secondary-emphasis" };
  }
};

// Tambahkan parameter onDetail agar komponen induk bisa menangkap event klik
export const getPeminjamanAktifColumns = (
  onDetail?: (item: PeminjamanAktifItemType) => void
): ColumnDef<PeminjamanAktifItemType>[] => [
  {
    accessorKey: "no",
    header: "No",
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      return pageIndex * pageSize + row.index + 1;
    },
  },
  {
    accessorKey: "kodeBarang",
    header: "Kode Alat",
    cell: ({ row }) => (
      <span className="font-monospace fw-semibold text-primary">
        {(row.original as any).kodeBarang || "-"}
      </span>
    ),
  },
  {
    accessorKey: "namaBarang",
    header: "Nama Alat Ukur",
    cell: ({ row }) => (
      <div>
        <div className="fw-semibold">{(row.original as any).namaBarang || "-"}</div>
      </div>
    ),
  },
  {
    accessorKey: "namaPeminjam",
    header: "Peminjam",
    cell: ({ row }) => {
      const item = row.original as any;
      return (
        <div>
          <div className="fw-semibold">{item.namaPeminjam || "-"}</div>
          <small className="text-muted font-monospace">ID: {item.peminjamId || "-"}</small>
        </div>
      );
    },
  },
  {
    accessorKey: "jumlah",
    header: "Jumlah",
    cell: ({ row }) => <span className="fw-semibold">{(row.original as any).jumlah ?? 1} unit</span>,
  },
  {
    accessorKey: "tanggalPinjam",
    header: "Tanggal Pinjam",
    cell: ({ row }) => {
      const item = row.original as any;
      const tgl = item.tanggalPinjam || item.tanggal_pinjam || item.tanggal;
      return <span className="text-muted">{tgl ? new Date(tgl).toLocaleString("id-ID") : "-"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const item = row.original as any;
      const statusVal = item.status || "dipinjam";
      const { bg, text } = statusVariant(statusVal);
      return (
        <Badge bg={bg} text={text} className="text-capitalize">
          {statusVal}
        </Badge>
      );
    },
  },
  // TAMBAHAN KOLOM AKSI DI SINI
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      return (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Lihat Detail Transaksi</Tooltip>}
        >
          <Button
            variant="light"
            size="sm"
            className="text-primary"
            onClick={() => onDetail && onDetail(row.original)}
          >
            <IconEye size={18} />
          </Button>
        </OverlayTrigger>
      );
    },
  },
];