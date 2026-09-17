import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Alat Ukur?</h3>
        <p className="text-xs text-gray-500 mb-6">Tindakan ini tidak bisa dibatalkan.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Batal</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Hapus</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;