import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';
import { Truck, CheckCircle, Navigation, Package, Tag, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../api';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DeliveryDashboard() {
  const { user } = useStore();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [availRes, mineRes] = await Promise.all([
        api.get('/orders/delivery/available'),
        api.get('/orders/delivery/my-assignments')
      ]);
      setAvailableOrders(availRes.data);
      setMyAssignments(mineRes.data);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || user.role !== 'delivery') return <Navigate to="/login" />;
  if (loading) return <div className="text-center mt-20 text-brand-500 font-bold animate-pulse">Loading dashboard...</div>;

  const currentTask = myAssignments.find(o => o.status === 'picked');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
              <Truck className="w-8 h-8" />
          </div>
          <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Partner Dashboard</h1>
              <p className="text-gray-500 font-medium tracking-wide">Stay safe on the road!</p>
          </div>
      </div>

      {currentTask && (
          <div className="bg-brand-500 rounded-3xl p-8 shadow-xl text-white transform hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                    <Navigation className="w-6 h-6 mr-2 animate-bounce"/>
                    Current Delivery
                </h2>
                <span className="bg-white text-brand-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">Active</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm border border-white/20">
                  <p className="text-brand-100 text-sm mb-1 uppercase tracking-wider font-bold">Delivery Address</p>
                  <p className="font-medium text-lg leading-relaxed mb-4">{currentTask.delivery_address}</p>
                  {currentTask.delivery_lat && currentTask.delivery_lng && (
                      <div className="h-48 w-full rounded-xl overflow-hidden border-2 border-white/30">
                          <MapContainer center={[currentTask.delivery_lat, currentTask.delivery_lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={[currentTask.delivery_lat, currentTask.delivery_lng]} />
                          </MapContainer>
                      </div>
                  )}
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm border border-white/20">
                    <h3 className="font-bold text-white mb-3">Order Contents</h3>
                    <ul className="space-y-2">
                        {(typeof currentTask.items === 'string' ? JSON.parse(currentTask.items) : currentTask.items).map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-white/20 px-4 py-2 rounded-lg">
                                <span className="font-medium">{item.qty}x {item.name}</span>
                            </li>
                        ))}
                    </ul>
              </div>

              <button 
                  onClick={() => handleUpdateStatus(currentTask.id, 'delivered')}
                  className="w-full bg-white text-brand-600 font-extrabold text-lg py-4 rounded-xl shadow-lg hover:bg-gray-50 transition-colors flex justify-center items-center"
              >
                  <CheckCircle className="w-6 h-6 mr-2"/>
                  Mark as Delivered
              </button>
          </div>
      )}

      {!currentTask && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Available Orders Nearby</h2>
               </div>
               {availableOrders.length === 0 ? (
                   <div className="p-12 text-center text-gray-500 font-medium text-lg">No orders available right now. Take a break!</div>
               ) : (
                   <ul className="divide-y divide-gray-100">
                        {availableOrders.map(order => (
                           <li key={order.id} className="hover:bg-gray-50 transition-colors flex flex-col">
                               <div className="p-6 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                   <div className="flex justify-between items-start mb-4">
                                       <div>
                                           <span className="font-bold text-lg text-gray-900 mr-2">Order #{order.id}</span>
                                           <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md">{order.status}</span>
                                       </div>
                                       <div className="text-right flex items-center">
                                           <div className="mr-4 text-right">
                                               <p className="text-xs text-gray-500 font-medium">Earnings</p>
                                               <p className="text-lg font-extrabold text-green-600">₹40</p>
                                           </div>
                                           <div className="text-gray-400">
                                               {expandedOrder === order.id ? <ChevronUp className="w-6 h-6"/> : <ChevronDown className="w-6 h-6"/>}
                                           </div>
                                       </div>
                                   </div>
                                   <div className="mb-4 flex space-x-2">
                                       <div className="flex-1 bg-gray-100 rounded-xl p-3">
                                           <p className="text-xs text-gray-400 font-bold uppercase mb-1">Drop Location</p>
                                           <p className="text-sm font-medium text-gray-800 line-clamp-2">{order.delivery_address}</p>
                                       </div>
                                   </div>
                                   {(order.status === 'accepted' || order.status === 'placed') && (
                                       <button 
                                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'picked'); }}
                                            className="w-full bg-brand-50 text-brand-600 border border-brand-200 font-bold py-3 rounded-xl hover:bg-brand-500 hover:text-white transition-all"
                                        >
                                            Pick Up Order
                                       </button>
                                   )}
                               </div>

                               {/* Expanded View */}
                               {expandedOrder === order.id && order.items && (
                                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Items List */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 flex items-center mb-3"><Package className="w-4 h-4 mr-2 text-brand-500"/> Order Items</h4>
                                                <ul className="space-y-3">
                                                    {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                                                        <li key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-3 text-sm">
                                                                <span className="font-bold text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">Qty: {item.qty}</span>
                                                                <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                                    <Tag className="w-3 h-3 mr-1"/> ₹{item.price}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            {/* Map Preview */}
                                            {order.delivery_lat && order.delivery_lng && (
                                                <div>
                                                    <h4 className="font-bold text-gray-800 flex items-center mb-3"><MapPin className="w-4 h-4 mr-2 text-brand-500"/> Location Map</h4>
                                                    <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                                        <MapContainer center={[order.delivery_lat, order.delivery_lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                            <Marker position={[order.delivery_lat, order.delivery_lng]} />
                                                        </MapContainer>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                               )}
                           </li>
                       ))}
                   </ul>
               )}
          </div>
      )}
    </div>
  );
}
