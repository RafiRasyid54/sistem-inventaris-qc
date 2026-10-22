// import node module libraries
import { Metadata } from "next";

// import custom components
import AlatukurMasukManager from "components/ruangalatukur/alatukurmasuk/AlatukurMasukManager";

export const metadata: Metadata = {
  title: "Alatukur Masuk | Ruang Alatukur - Admin Panel",
  description: "Mencatat alat yang masuk",
};

const AlatukurMasukPage = () => {
  return <AlatukurMasukManager />;
};

export default AlatukurMasukPage;