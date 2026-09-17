import { Metadata } from "next";
import DataAlatUkurManager from "/components/alat-ukur/DataAlatUkurManager";

export const metadata: Metadata = {
  title: "Data Alat Ukur | Ruang Alat Ukur - Admin Panel",
  description: "Mengelola seluruh data peralatan yang terdapat di Ruang Alat Ukur",
};

export default function DataAlatUkurPage() {
  return <DataAlatUkurManager />;
}