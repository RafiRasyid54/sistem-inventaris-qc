import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface CartFABProps {
  count: number;
  onClick: () => void;
}

export const CartFAB: React.FC<CartFABProps> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <button
        onClick={onClick}
        style={{
          backgroundColor: '#2563eb', // Biru terang yang mencolok
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 15px 35px rgba(37, 99, 235, 0.5)',
          border: '1px solid #60a5fa',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
      >
        {/* Ikon Tas & Badge Jumlah */}
        <div 
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e40af',
            padding: '8px',
            borderRadius: '50%',
          }}
        >
          <ShoppingBag size={20} color="#ffffff" />
          <span 
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: '#f59e0b', // Oranye/Amber untuk badge angka
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2563eb',
            }}
          >
            {count}
          </span>
        </div>

        {/* Teks Informasi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', fontSize: '14px' }}>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>
            Keranjang Peminjaman ({count} Alat)
          </span>
          <span style={{ color: '#93c5fd' }}>|</span>
          <span style={{ color: '#dbeafe', textDecoration: 'underline' }}>Lihat & Proses</span>
        </div>

        <ChevronRight size={18} color="#dbeafe" />
      </button>
    </div>
  );
};

export default CartFAB;