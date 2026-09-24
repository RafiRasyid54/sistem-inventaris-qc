import { Metadata } from "next";
import RiwayatKalibrasiManager from "components/riwayat/kalibrasi/RiwayatKalibrasiManager";

export const metadata: Metadata = {
  title: "Riwayat Kalibrasi Alat Ukur | Ruang Alat Ukur - Admin Panel",
  description: "Menampilkan riwayat kalibrasi seluruh alat ukur beserta status jatuh temponya.",
};

const RiwayatKalibrasiPage = () => {
  return <RiwayatKalibrasiManager />;
};

export default RiwayatKalibrasiPage;