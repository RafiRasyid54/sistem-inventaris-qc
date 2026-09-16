// import node module libraries
import { Metadata } from "next";

// import custom components
import DataAlatukurManager from "components/ruangalat ukur/dataalat ukur/DataAlatukurManager";

export const metadata: Metadata = {
  title: "Data Alatukur | Ruang Alatukur - Admin Panel",
  description: "Mengelola seluruh data peralatan yang terdapat di Ruang Alatukur",
};

const DataAlatukurPage = () => {
  return <DataAlatukurManager />;
};

export default DataAlatukurPage;
