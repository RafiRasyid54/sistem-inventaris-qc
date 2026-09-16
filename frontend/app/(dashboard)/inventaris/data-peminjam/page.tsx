// import node module libraries
import { Metadata } from "next";

// import custom components
import DataPeminjamManager from "components/ruangalat ukur/datapeminjam/DataPeminjamManager";

export const metadata: Metadata = {
  title: "Data Peminjam | Ruang Alatukur - Admin Panel",
  description: "Master data pegawai yang dapat melakukan peminjaman alat",
};

const DataPeminjamPage = () => {
  return <DataPeminjamManager />;
};

export default DataPeminjamPage;
