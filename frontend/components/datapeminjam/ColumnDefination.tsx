"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown, Badge, Spinner } from "react-bootstrap";
import { IconDotsVertical } from "@tabler/icons-react";

import { PeminjamType } from "types/DataAlatUkurTypes";
import ActionMenu from "components/common/ActionMenu";

interface ColumnHandlers {
  canManage?: boolean;
  onEdit: (item: PeminjamType) => void;
  onDelete: (item: PeminjamType) => void; // nonaktifkan
  onAktifkan: (item: PeminjamType) => void;
  onGantiRole: (item: PeminjamType, roleBaru: "user" | "inventory man") => void;
  togglingId?: string | null; 
  togglingRoleId?: string | null; 
}

export const getPeminjamColumns = ({
  canManage = false,
  onEdit,
  onDelete,
  onAktifkan,
  onGantiRole,
  togglingId,
}: ColumnHandlers): ColumnDef<PeminjamType>[] => {
  const baseColumns: ColumnDef<PeminjamType>[] = [
    {
      id: "nama", // Menggunakan id alih-alih accessorKey karena kita memodifikasi cell secara manual
      header: "Nama Pegawai",
      cell: ({ row }) => {
        // Gunakan as any untuk menghindari error TypeScript jika properti fallback tidak ada di PeminjamType
        const item = row.original as any;
        
        // Cek semua kemungkinan kunci data nama dari API
        const namaPegawai = item.nama || item.nama_peminta || item.name || item.username || item.nama_lengkap || "-";
        
        return (
          <span className="fw-semibold">{namaPegawai}</span>
        );
      },
    },
    {
      accessorKey: "divisi",
      header: "Divisi",
      cell: ({ row }) => row.original.divisi || "-",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const isInventoryMan = row.original.role === "inventory man";
        return (
          <Badge
            bg={isInventoryMan ? "warning-subtle" : "light"}
            text={isInventoryMan ? "warning-emphasis" : "dark"}
            className="fw-semibold border"
          >
            {isInventoryMan ? "Inventory Man" : "Pekerja"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "aktif",
      header: "Status",
      cell: ({ row }) => {
        const aktif = row.original.aktif;
        return (
          <Badge
            bg={aktif ? "success-subtle" : "secondary-subtle"}
            text={aktif ? "success-emphasis" : "secondary-emphasis"}
            className="fw-semibold"
          >
            {aktif ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => {
        const item = row.original;
        const isToggling = togglingId === item.id;
        const isInventoryMan = item.role === "inventory man";

        return (
          <ActionMenu
            toggleButton={
              isToggling ? <Spinner animation="border" size="sm" /> : <IconDotsVertical size={20} />
            }
            className="btn btn-ghost btn-icon btn-sm rounded-circle"
            drop="start"
            align="start"
          >
            <Dropdown.Item onClick={() => onEdit(item)}>
              Edit Data
            </Dropdown.Item>

            {/* --- PILIHAN UBAH ROLE --- */}
            {isInventoryMan ? (
              <Dropdown.Item onClick={() => onGantiRole(item, "user")}>
                Jadikan Pekerja Biasa
              </Dropdown.Item>
            ) : (
              <Dropdown.Item onClick={() => onGantiRole(item, "inventory man")}>
                Jadikan Inventory Man
              </Dropdown.Item>
            )}
            {/* ------------------------- */}

            <Dropdown.Divider />

            {item.aktif ? (
              <Dropdown.Item
                className="text-danger"
                onClick={() => onDelete(item)}
                disabled={isToggling}
              >
                Nonaktifkan
              </Dropdown.Item>
            ) : (
              <Dropdown.Item
                className="text-success"
                onClick={() => onAktifkan(item)}
                disabled={isToggling}
              >
                Aktifkan Kembali
              </Dropdown.Item>
            )}
          </ActionMenu>
        );
      },
    },
  ];

  return canManage ? baseColumns : baseColumns.filter((col) => col.id !== "aksi");
};