// import node module libraries
import { Metadata } from "next";

// import custom components
import PengembalianManager from "components/ruangalat ukur/pengembalian/PengembalianManager";

export const metadata: Metadata = {
  title: "Pengembalian Alat | Ruang Alatukur - Admin Panel",
  description: "Scan kartu peminjam dan kembalikan alat sekaligus",
};

const PengembalianPage = () => {
  return <PengembalianManager />;
};

export default PengembalianPage;