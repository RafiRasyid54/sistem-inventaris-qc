// import node module libraries
import { Metadata } from "next";

// import custom components
import RiwayatConsumableKeluarManager from "components/ruangalat ukur/riwayat/consumablekeluar/RiwayatConsumableKeluarManager";

export const metadata: Metadata = {
  title: "Riwayat Consumable Keluar | Ruang Alatukur - Admin Panel",
  description: "Menampilkan riwayat pengambilan barang consumable",
};

const RiwayatConsumableKeluarPage = () => {
  return <RiwayatConsumableKeluarManager />;
};

export default RiwayatConsumableKeluarPage;
