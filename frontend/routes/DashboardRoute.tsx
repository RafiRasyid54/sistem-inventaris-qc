// import node modules libraries
import { v4 as uuid } from "uuid";

import {
  IconLayoutDashboard,
  IconBoxSeam,
  IconArrowsExchange,
  IconHistory,
  IconReportAnalytics,
  IconUsers,
  IconShieldLock,
} from "@tabler/icons-react";

// import custom type
import { MenuItemType } from "types/menuTypes";

// ============================================================
// DASHBOARD MENU
// Properti `roles` (opsional): menu hanya tampil untuk role yang terdaftar.
// Tanpa `roles` = tampil untuk semua role.
// ============================================================

export const DashboardMenu: MenuItemType[] = [
  // ==========================================================
  // OPERASIONAL ALAT
  // ==========================================================

  {
    id: uuid(),
    title: "Operasional Alat",
    grouptitle: true,
  },

  {
    id: uuid(),
    title: "Dashboard",
    link: "/",
    icon: (
      <IconLayoutDashboard
        size={20}
        strokeWidth={1.5}
      />
    ),
  },

  // ==========================================================
  // INVENTARIS
  // ==========================================================

  {
    id: uuid(),
    title: "Inventaris",

    icon: (
      <IconBoxSeam
        size={20}
        strokeWidth={1.5}
      />
    ),

    children: [
      {
        id: uuid(),
        name: "Data Alat Ukur",
        link: "/inventaris/data-alat-ukur",
      },

      {
        id: uuid(),
        name: "Data Peminjam",
        link: "/inventaris/data-peminjam",
      },

      {
        id: uuid(),
        name: "Data Pekerjaan",
        link: "/inventaris/data-pekerjaan",
      },
    ],
  },

  // ==========================================================
  // TRANSAKSI (viewer hanya read-only, jadi menu transaksi disembunyikan)
  // ==========================================================

  {
    id: uuid(),
    title: "Transaksi",
    roles: ["admin", "petugas"],

    icon: (
      <IconArrowsExchange
        size={20}
        strokeWidth={1.5}
      />
    ),

    children: [
      {
        id: uuid(),
        name: "Peminjaman Aktif",
        link: "/transaksi/peminjaman-aktif",
      },

      {
        id: uuid(),
        name: "Pengembalian Alat",
        link: "/transaksi/pengembalian",
      },
    ],
  },

  // ==========================================================
  // RIWAYAT
  // ==========================================================

  {
    id: uuid(),
    title: "Riwayat",

    icon: (
      <IconHistory
        size={20}
        strokeWidth={1.5}
      />
    ),

    children: [
      {
        id: uuid(),
        name: "Peminjaman Alat Ukur",
        link: "/riwayat/peminjaman-alat-ukur",
      },

      {
        id: uuid(),
        name: "Kalibrasi Alat Ukur",
        link: "/riwayat/kalibrasi-alat-ukur",
      },
    ],
  },

  // ==========================================================
  // LAPORAN
  // ==========================================================

  {
    id: uuid(),
    title: "Laporan Kerusakan Alat",
    link: "/laporan",

    icon: (
      <IconReportAnalytics
        size={20}
        strokeWidth={1.5}
      />
    ),
  },

  // ==========================================================
  // ADMINISTRASI (admin saja)
  // ==========================================================

  {
    id: uuid(),
    title: "Administrasi",
    grouptitle: true,
    roles: ["admin"],
  },

  {
    id: uuid(),
    title: "Manajemen User",
    link: "/data-user",
    roles: ["admin"],

    icon: (
      <IconUsers
        size={20}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: uuid(),
    title: "Matriks Hak Akses",
    link: "/role-matrix",
    roles: ["admin"],

    icon: (
      <IconShieldLock
        size={20}
        strokeWidth={1.5}
      />
    ),
  },
];