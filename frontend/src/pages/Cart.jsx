import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart } = useStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/" className="bg-brand-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-600 transition-colors">
          Browse Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in">
      <h1 className="text-3xl font-extrabold text-brand-900 mb-8">Your Cart</h1>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
        <ul className="divide-y divide-gray-100">
          {cart.map((item) => (
            <li key={item.id} className="py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-brand-50 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image_url || `https://picsum.photos/seed/${item.name}/100/100`} alt={item.name} className="w-full h-full object-cover"/>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <div className="text-sm font-medium border border-gray-200 inline-block px-2 py-0.5 rounded text-gray-600 mt-1">
                      Qty: {item.quantity}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-xl font-extrabold text-gray-900">₹{item.price * item.quantity}</span>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600 transition-colors bg-red-50 p-2 rounded-full"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        
        <div className="border-t border-gray-100 pt-6 mt-2 flex flex-col items-end">
            <div className="flex justify-between w-full md:w-1/2 text-lg mb-2">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">₹{total}</span>
            </div>
            <div className="flex justify-between w-full md:w-1/2 text-lg mb-4">
                <span className="text-gray-500 font-medium">Delivery Fee</span>
                <span className="font-bold text-gray-900">₹40</span>
            </div>
            <div className="flex justify-between w-full md:w-1/2 text-2xl font-extrabold text-brand-600 mb-8 pt-4 border-t border-dashed border-gray-200">
                <span>Total</span>
                <span>₹{total + 40}</span>
            </div>
            
            <button 
                onClick={() => navigate('/checkout')}
                className="w-full md:w-1/2 bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-brand-500/50 hover:bg-brand-600 transition-all flex justify-center items-center group"
            >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
}
