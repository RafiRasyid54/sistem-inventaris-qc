import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AlatUkur } from '../../types/DataAlatUkurTypes';

interface AlatUkurFormModalProps {
  isOpen: boolean;
  item: AlatUkur | null;
  onClose: () => void;
  onSubmit: (formData: Partial<AlatUkur>) => void;
}

export const AlatUkurFormModal: React.FC<AlatUkurFormModalProps> = ({ isOpen, item, onClose, onSubmit }) => {
  const [form, setForm] = useState<Partial<AlatUkur>>({
    kode_alat: '',
    nama_alat: '',
    kategori: '',
    merk: '',
    kondisi: 'Baik',
    status_kalibrasi: 'Terkalibrasi',
  });

  useEffect(() => {
    if (item) setForm(item);
    else setForm({ kode_alat: '', nama_alat: '', kategori: '', merk: '', kondisi: 'Baik', status_kalibrasi: 'Terkalibrasi' });
  }, [item, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-gray-800 mb-4">{item ? 'Edit Alat Ukur' : 'Tambah Alat Ukur'}</h3>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
          <input
            type="text"
            placeholder="Kode Alat"
            value={form.kode_alat || ''}
            onChange={(e) => setForm({ ...form, kode_alat: e.target.value })}
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <input
            type="text"
            placeholder="Nama Alat Ukur"
            value={form.nama_alat || ''}
            onChange={(e) => setForm({ ...form, nama_alat: e.target.value })}
            className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.kondisi || 'Baik'}
              onChange={(e) => setForm({ ...form, kondisi: e.target.value as any })}
              className="p-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="Baik">Baik</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Rusak">Rusak</option>
            </select>
            <select
              value={form.status_kalibrasi || 'Terkalibrasi'}
              onChange={(e) => setForm({ ...form, status_kalibrasi: e.target.value as any })}
              className="p-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            >
              <option value="Terkalibrasi">Terkalibrasi</option>
              <option value="Perlu Kalibrasi">Perlu Kalibrasi</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2">
            Simpan Data
          </button>
        </form>
      </div>
    </div>
  );
};