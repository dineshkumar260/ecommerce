import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import api from '../api';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we would use WebSockets / Socket.io for live tracking
    // Here we use short polling for the demo
    const fetchOrder = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        const currentOrder = res.data.find(o => o.id === parseInt(id));
        if (currentOrder) setOrder(currentOrder);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="text-center mt-20 animate-pulse text-brand-500 font-bold">Loading your order status...</div>;
  if (!order) return <div className="text-center mt-20 text-red-500 font-bold">Order not found.</div>;

  const steps = [
    { key: 'placed', label: 'Order Placed', icon: Clock },
    { key: 'accepted', label: 'Order Accepted', icon: Package },
    { key: 'picked', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Track Order #{order.id}</h1>
          <p className="text-gray-500 font-medium">Estimated delivery time: 20-30 mins</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="relative">
          {/* Progress Bar Line */}
          <div className="absolute top-8 left-10 right-10 h-1 bg-gray-100 rounded-full z-0"></div>
          <div 
            className="absolute top-8 left-10 h-1 bg-brand-500 rounded-full z-0 transition-all duration-1000 ease-out"
            style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
          ></div>

          <div className="relative z-10 flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isActive = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-md
                    ${isCompleted ? 'bg-brand-500 text-white shadow-brand-500/40' : 'bg-white text-gray-300 border-2 border-gray-100'}
                    ${isActive ? 'ring-4 ring-brand-100 scale-110' : ''}
                  `}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className={`mt-4 text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {order.status === 'picked' && (
          <div className="mt-8 bg-brand-50 rounded-2xl p-6 border border-brand-100 text-center animate-in fade-in">
              <p className="text-brand-900 font-bold mb-1">Your delivery partner is on the way!</p>
              <p className="text-brand-600 text-sm">Please keep your phone handy.</p>
          </div>
      )}
    </div>
  );
}
