import React from 'react';
// Tambahkan karakter '@' di depan '/components'
import DataPekerjaanManager from '/components/ruangalat ukur/datapekerjaan/DataPekerjaanManager';

export const metadata = {
  title: 'Data Pekerjaan - PULSE',
  description: 'Manajemen Data Pekerjaan',
};

export default function DataPekerjaanPage() {
  return (
    <>
      <DataPekerjaanManager />
    </>
  );
}