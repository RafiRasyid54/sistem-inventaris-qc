import React from 'react';
import { IconShoppingBag, IconChevronRight } from '@tabler/icons-react';

interface CartFABProps {
  count: number;
  onClick: () => void;
}

// Warna tema PLN
const NAVY = '#06355f';
const NAVY_HOVER = '#0b4a82';
const YELLOW = '#ffc20e';

export const CartFAB: React.FC<CartFABProps> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        // Di bawah backdrop modal Bootstrap (1050) supaya tidak menimpa modal
        zIndex: 1040,
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Buka keranjang peminjaman, ${count} alat`}
        style={{
          backgroundColor: NAVY,
          color: '#ffffff',
          padding: '10px 22px 10px 12px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 15px 35px rgba(6, 53, 95, 0.35)',
          border: `2px solid ${YELLOW}`,
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          maxWidth: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
      >
        {/* Ikon Tas & Badge Jumlah */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: YELLOW,
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            flex: 'none',
          }}
        >
          <IconShoppingBag size={20} color={NAVY} />
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: '#e2231a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              minWidth: '20px',
              height: '20px',
              padding: '0 4px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${NAVY}`,
            }}
          >
            {count}
          </span>
        </div>

        {/* Teks Informasi */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            Keranjang Peminjaman ({count} Alat)
          </span>
          <span style={{ color: '#7fa6cc' }}>|</span>
          <span style={{ color: YELLOW, fontWeight: 600, textDecoration: 'underline' }}>
            Lihat &amp; Proses
          </span>
        </div>

        <IconChevronRight size={18} color={YELLOW} style={{ flex: 'none' }} />
      </button>
    </div>
  );
};

export default CartFAB;