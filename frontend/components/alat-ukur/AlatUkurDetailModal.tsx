import React, { useEffect, useState } from 'react';
import { X, Calendar, Award } from 'lucide-react';
import { AlatUkur, RiwayatKalibrasi } from '../../types/DataAlatUkurTypes';
import apiFetch from '/lib/apiFetch';

interface AlatUkurDetailModalProps {
  item: AlatUkur | null;
  onClose: () => void;
}

export const AlatUkurDetailModal: React.FC<AlatUkurDetailModalProps> = ({ item, onClose }) => {
  const [kalibrasi, setKalibrasi] = useState<RiwayatKalibrasi[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.id) {
      setLoading(true);
      apiFetch<RiwayatKalibrasi[]>(`/alat-ukur/${item.id}/riwayat-kalibrasi`)
        .then((res) => setKalibrasi(res))
        .catch(() => setKalibrasi([]))
        .finally(() => setLoading(false));
    }
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-1">{item.nama_alat}</h3>
        <p className="text-xs font-mono text-blue-600 mb-4">{item.kode_alat}</p>

        <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-xl mb-6">
          <div><span className="text-gray-400">Merek:</span> {item.merk || '-'}</div>
          <div><span className="text-gray-400">Lokasi:</span> {item.lokasi || '-'}</div>
        </div>

        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Award size={16} /> Riwayat Kalibrasi
        </h4>

        {loading ? (
          <p className="text-xs text-gray-400">Memuat riwayat...</p>
        ) : kalibrasi.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada riwayat kalibrasi.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {kalibrasi.map((k) => (
              <div key={k.id} className="p-2 border border-gray-100 rounded-lg text-xs flex justify-between items-center">
                <div>
                  <p className="font-semibold">{k.hasil}</p>
                  <p className="text-gray-400 flex items-center gap-1"><Calendar size={12} /> {k.tanggal_kalibrasi}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};