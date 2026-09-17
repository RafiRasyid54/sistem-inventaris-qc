// import node modules libraries
import { v4 as uuid } from "uuid";

import {
  IconLayoutDashboard,
  IconBoxSeam,
  IconArrowsExchange,
  IconHistory,
  IconShoppingCart,
  IconTool,
  IconReportAnalytics,
  IconUsers,
} from "@tabler/icons-react";

// import custom type
import { MenuItemType } from "types/menuTypes";

// ============================================================
// DASHBOARD MENU
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
        name: "Data Consumable",
        link: "/inventaris/data-consumable",
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
  // TRANSAKSI
  // ==========================================================

  {
    id: uuid(),
    title: "Transaksi",

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

      {
        id: uuid(),
        name: "Consumable Masuk",
        link: "/transaksi/consumable-masuk",
      },

      {
        id: uuid(),
        name: "Alat Ukur Masuk",
        link: "/transaksi/alat-ukur-masuk",
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
        name: "Consumable Keluar",
        link: "/riwayat/consumable-keluar",
      },

      {
        id: uuid(),
        name: "Riwayat Perbaikan",
        link: "/riwayat/perbaikan",
      },
    ],
  },

  // ==========================================================
  // PENGAJUAN ORDER
  // ==========================================================

  {
    id: uuid(),
    title: "Pengajuan Order",

    icon: (
      <IconShoppingCart
        size={20}
        strokeWidth={1.5}
      />
    ),

    children: [
      {
        id: uuid(),
        name: "Order Consumable",
        link: "/order/order-consumable",
      },

      {
        id: uuid(),
        name: "Order Alat Ukur",
        link: "/order/order-alat-ukur",
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
  // PEMELIHARAAN MESIN
  // ==========================================================

  {
    id: uuid(),
    title: "Pemeliharaan Mesin",
    grouptitle: true,
  },

  // ==========================================================
  // DASHBOARD PEMELIHARAAN
  // ==========================================================

  {
    id: uuid(),
    title: "Dashboard Pemeliharaan",
    link: "/pemeliharaan/dashboard",

    icon: (
      <IconLayoutDashboard
        size={20}
        strokeWidth={1.5}
      />
    ),
  },

  // ==========================================================
  // PEMELIHARAAN
  // ==========================================================

  {
    id: uuid(),
    title: "Pemeliharaan",

    icon: (
      <IconTool
        size={20}
        strokeWidth={1.5}
      />
    ),

    children: [
      {
        id: uuid(),
        name: "Pemeliharaan Mesin",
        link: "/pemeliharaan/data-mesin",
      },

      {
        id: uuid(),
        name: "Pemeliharaan Motor Konversi",
        link: "/pemeliharaan/motor-konversi",
      },
    ],
  },

  // ==========================================================
  // ADMINISTRASI
  // ==========================================================

  {
    id: uuid(),
    title: "Administrasi",
    grouptitle: true,
  },

  {
    id: uuid(),
    title: "Manajemen User",
    link: "/data-user",

    icon: (
      <IconUsers
        size={20}
        strokeWidth={1.5}
      />
    ),
  },
];