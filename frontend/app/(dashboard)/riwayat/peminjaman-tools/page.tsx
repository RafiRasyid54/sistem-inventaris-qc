// import node module libraries
import { Metadata } from "next";

// import custom components
import RiwayatPeminjamanManager from "components/ruangalat ukur/riwayat/peminjaman/RiwayatPeminjamanManager";

export const metadata: Metadata = {
  title: "Riwayat Peminjaman Alatukur | Ruang Alatukur - Admin Panel",
  description:
    "Menampilkan riwayat seluruh transaksi peminjaman alat ukur yang telah dikembalikan",
};

const RiwayatPeminjamanPage = () => {
  return <RiwayatPeminjamanManager />;
};

export default RiwayatPeminjamanPage;
