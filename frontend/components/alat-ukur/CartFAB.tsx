import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface CartFABProps {
  count: number;
  onClick: () => void;
}

export const CartFAB: React.FC<CartFABProps> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-all animate-bounce z-40"
    >
      <ShoppingBag size={22} />
      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {count}
      </span>
    </button>
  );
};

export default CartFAB;