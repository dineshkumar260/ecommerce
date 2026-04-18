import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api';
import { CreditCard, MapPin, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const { cart, shopId, clearCart, user } = useStore();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const navigate = useNavigate();

  if (!user) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Please login to checkout</h2>
            <button onClick={() => navigate('/login')} className="bg-brand-500 text-white px-6 py-2 rounded-full font-bold">Login</button>
        </div>
    );
  }

  // Calculate total
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = itemTotal + 40; // Flat delivery fee

  const mockPaymentOptions = {
    key: "mock_api_key_for_razorpay", // Enter the Key ID generated from the Dashboard
    amount: total * 100, // Amount is in currency subunits. Default currency is INR.
    currency: "INR",
    name: "Hyperlocal Delivery",
    description: "Order Payment",
    image: "https://picsum.photos/100",
    handler: async function (response) {
        // Payment successful callback
        placeOrderBackend(response.razorpay_payment_id);
    },
    prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone
    },
    theme: {
        color: "#fc8019"
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        // 1. Mock Razorpay Order Creation API Call
        const { data: mockOrder } = await api.post('/payments/create-order', { amount: total });

        // 2. Open Mock Payment Window (simulated here since we don't have real Razorpay script)
        // Normally: const rzp = new window.Razorpay(options); rzp.open();
        
        // Let's simulate a successful payment delay
        setTimeout(() => {
            placeOrderBackend('pay_mock_' + Math.floor(Math.random() * 1000000));
        }, 1500);

    } catch (err) {
        console.error(err);
        alert('Payment initialization failed.');
        setLoading(false);
    }
  };

  const placeOrderBackend = async (paymentId) => {
    try {
        const orderData = {
            shop_id: shopId,
            items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price_at_time: i.price })),
            delivery_address: address,
            delivery_lat: 12.9716, // Mock location for demo
            delivery_lng: 77.5946,
            payment_id: paymentId
        };
        const res = await api.post('/orders', orderData);
        setOrderId(res.data.orderId);
        setSuccess(true);
        clearCart();
    } catch (err) {
        alert('Order placement failed!');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-lg text-gray-600 mb-8 font-medium">Your order #{orderId} has been placed successfully.</p>
              <button 
                  onClick={() => navigate(`/order/${orderId}`)}
                  className="bg-brand-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-600 transition-colors"
              >
                  Track Order
              </button>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-3xl shadow-sm border border-gray-100 pb-10">
      <h1 className="text-3xl font-extrabold text-brand-900 mb-8 border-b border-gray-100 pb-4 p-4">Checkout</h1>
      
      <form onSubmit={handleCheckout} className="space-y-8 px-4">
        <div>
            <h3 className="text-lg font-bold flex items-center mb-4 text-gray-800">
                <MapPin className="w-5 h-5 mr-2 text-brand-500"/> Delivery Address
            </h3>
            <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 font-medium"
                rows="3"
                required
                placeholder="Enter your full exact delivery location..."
            ></textarea>
        </div>

        <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
            <h3 className="text-lg font-bold flex items-center mb-4 text-brand-900">
                <CreditCard className="w-5 h-5 mr-2 text-brand-600"/> Payment Summary
            </h3>
            <div className="space-y-2 text-brand-800 font-medium mb-4">
                <div className="flex justify-between">
                    <span>Items Total</span>
                    <span>₹{itemTotal}</span>
                </div>
                <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹40</span>
                </div>
            </div>
            <div className="flex justify-between border-t border-brand-200 pt-4 text-2xl font-extrabold text-brand-600">
                <span>To Pay</span>
                <span>₹{total}</span>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={loading || cart.length === 0}
            className="w-full bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-brand-500/50 hover:bg-brand-600 transition-all flex justify-center items-center text-lg"
        >
            {loading ? <span className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></span> : `Pay ₹${total}`}
        </button>
      </form>
    </div>
  );
}
