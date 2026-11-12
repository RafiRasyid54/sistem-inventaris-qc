"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button } from "react-bootstrap";
import { IconEdit, IconFileTypePdf } from "@tabler/icons-react";
import { RiwayatKalibrasiType } from "types/RiwayatTypes";
import { getStatusKalibrasi } from "services/riwayatKalibrasiService";

const kondisiBadge = (kondisi: string) => {
  const map: Record<string, string> = {
    Baik: "success",
    RPP: "warning",
    RT: "danger",
  };
  return (
    <Badge bg={map[kondisi] ?? "secondary"} className="fw-semibold">
      {kondisi}
    </Badge>
  );
};

const statusBadge = (raw: string | null) => {
  const status = getStatusKalibrasi(raw);
  const map: Record<string, { bg: string; label: string }> = {
    berlaku: { bg: "success", label: "Berlaku" },
    mendekati: { bg: "warning", label: "Mendekati" },
    lewat: { bg: "danger", label: "Lewat tempo" },
    unknown: { bg: "secondary", label: "-" },
  };
  const s = map[status];
  return (
    <Badge bg={s.bg} className="fw-semibold">
      {s.label}
    </Badge>
  );
};

interface RiwayatKalibrasiColumnOptions {
  canManage: boolean;
  onEdit: (item: RiwayatKalibrasiType) => void;
}

export const getRiwayatKalibrasiColumns = ({
  canManage,
  onEdit,
}: RiwayatKalibrasiColumnOptions): ColumnDef<RiwayatKalibrasiType>[] => {
  const columns: ColumnDef<RiwayatKalibrasiType>[] = [
    {
      accessorKey: "kodeAlat",
      header: "Kode Alat",
    },
    {
      accessorKey: "namaAlat",
      header: "Nama Alat",
    },
    {
      accessorKey: "merk",
      header: "Merk",
    },
    {
      accessorKey: "tanggalKalibrasi",
      header: "Tanggal Kalibrasi",
    },
    {
      accessorKey: "tanggalJatuhTempo",
      header: "Jatuh Tempo",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original.tanggalJatuhTempoRaw),
    },
    {
      id: "kondisi",
      header: "Kondisi",
      cell: ({ row }) => kondisiBadge(row.original.kondisi),
    },
    {
      accessorKey: "pelaksana",
      header: "Pelaksana",
    },
    {
      id: "sertifikat",
      header: "Sertifikat",
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.fileSertifikatUrl;
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
          >
            <IconFileTypePdf size={14} /> Buka
          </a>
        ) : (
          <span className="text-secondary">-</span>
        );
      },
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
    },
  ];

  // Kolom Aksi hanya untuk admin / petugas
  if (canManage) {
    columns.push({
      id: "aksi",
      header: "Aksi",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline-primary"
          size="sm"
          className="d-inline-flex align-items-center gap-1"
          onClick={() => onEdit(row.original)}
          aria-label={`Edit kalibrasi ${row.original.kodeAlat}`}
        >
          <IconEdit size={14} /> Edit
        </Button>
      ),
    });
  }

  return columns;
};