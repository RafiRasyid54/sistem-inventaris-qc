"use client";

// import custom components
import DataUserManager from "components/datauser/DataUserManager";

export default function DataUserPage() {
  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen User</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Mengelola seluruh akun pengguna sistem.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <DataUserManager />
      </div>
    </div>
  );
}