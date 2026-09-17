"use client";

import DashboardManager from "components/dashboard/DashboardManager";

const HomePage = () => {
  // Karena middleware permission dan role sudah dihapus,
  // halaman utama langsung merender DashboardManager dengan aman.
  return <DashboardManager />;
};

export default HomePage;