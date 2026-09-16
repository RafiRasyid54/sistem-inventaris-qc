// import node module libraries
import { Metadata } from "next";

// import custom components
import PeminjamanAktifManager from "components/ruangalat ukur/peminjamanaktif/PeminjamanAktifManager";

export const metadata: Metadata = {
  title: "Peminjaman Aktif | Ruang Alatukur - Admin Panel",
  description:
    "Menampilkan seluruh alat yang masih dipinjam dan belum dikembalikan",
};

const PeminjamanAktifPage = () => {
  return <PeminjamanAktifManager />;
};

export default PeminjamanAktifPage;
