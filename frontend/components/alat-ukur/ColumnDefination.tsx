import React from 'react';
import { Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { AlatUkur } from '../../types/DataAlatUkurTypes';

interface ColumnDefinitionProps {
  items: AlatUkur[];
  onDetail: (item: AlatUkur) => void;
  onEdit: (item: AlatUkur) => void;
  onDelete: (item: AlatUkur) => void;
  onAddToCart: (item: AlatUkur) => void;
}

export const ColumnDefinition: React.FC<ColumnDefinitionProps> = ({
  items,
  onDetail,
  onEdit,
  onDelete,
  onAddToCart,
}) => {
  return (
    <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
      <table className="w-full text-left text-sm bg-white">
        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 font-semibold">
          <tr>
            <th className="p-3">Kode Alat</th>
            <th className="p-3">Nama Alat Ukur</th>
            <th className="p-3">Kategori & Merek</th>
            <th className="p-3">Kondisi</th>
            <th className="p-3">Status Kalibrasi</th>
            <th className="p-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="p-3 font-mono font-semibold text-blue-600">{item.kode_alat}</td>
              <td className="p-3 font-medium text-gray-800">{item.nama_alat}</td>
              <td className="p-3 text-gray-500">{item.kategori || '-'} ({item.merk || '-'})</td>
              <td className="p-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  item.kondisi === 'Baik' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {item.kondisi}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  item.status_kalibrasi === 'Terkalibrasi' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {item.status_kalibrasi}
                </span>
              </td>
              <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => onAddToCart(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Pinjam">
                    <ShoppingCart size={16} />
                  </button>
                  <button onClick={() => onDetail(item)} className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg" title="Detail">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => onDelete(item)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg" title="Hapus">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};