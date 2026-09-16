// import node module libraries
import { Metadata } from "next";

// import custom components
import ProfileManager from "components/ruangalat ukur/profile/ProfileManager";

export const metadata: Metadata = {
  title: "Profil Saya | Ruang Alatukur",
  description: "Kelola informasi profil dan keamanan akun Ruang Alatukur",
};

const ProfilePage = () => {
  return <ProfileManager />;
};

export default ProfilePage;
