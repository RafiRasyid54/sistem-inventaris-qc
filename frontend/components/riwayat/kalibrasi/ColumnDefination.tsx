"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "react-bootstrap";
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

export const getRiwayatKalibrasiColumns =
  (): ColumnDef<RiwayatKalibrasiType>[] => [
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
      accessorKey: "keterangan",
      header: "Keterangan",
    },
  ];