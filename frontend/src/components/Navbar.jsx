import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ShoppingBag, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout, cart } = useStore();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-brand-500 tracking-tighter">
          HyperLocal
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/cart" className="relative group">
            <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-brand-500 transition-colors" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Hello, {user.name}
              </span>
              {user.role === 'seller' && (
                <Link to="/seller" className="text-sm font-medium text-brand-600 hover:text-brand-900 transition-colors">
                  Seller Dashboard
                </Link>
              )}
              {user.role === 'delivery' && (
                <Link to="/delivery" className="text-sm font-medium text-brand-600 hover:text-brand-900 transition-colors">
                  Delivery Dashboard
                </Link>
              )}
              <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 text-brand-600 hover:text-brand-900 font-medium transition-colors">
              <User className="w-5 h-5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
