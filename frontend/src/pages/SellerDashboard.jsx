import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';
import { Plus, Package, Store, ArrowLeft, Tag, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export default function SellerDashboard() {
  const { user } = useStore();
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'shops'
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Shop management
  const [newShop, setNewShop] = useState({ name: '', description: '', address: '', latitude: 12.9716, longitude: 77.5946 });

  function LocationMarker() {
      useMapEvents({
          click(e) {
              setNewShop(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
          },
      });
      return newShop.latitude !== 0 ? (
          <Marker position={[newShop.latitude, newShop.longitude]}></Marker>
      ) : null;
  }

  // Product management
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '' });
  const [productImage, setProductImage] = useState(null);

  useEffect(() => {
    if (user?.role !== 'seller') return;
    fetchData();
    // eslint-disable-next-line
  }, [user]);

  const fetchData = async () => {
    try {
      const [shopsRes, ordersRes] = await Promise.all([
        api.get('/shops/my-shops'),
        api.get('/orders/seller')
      ]);
      setShops(shopsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shopId) => {
    try {
      const res = await api.get(`/products/shop/${shopId}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShop = async (e) => {
      e.preventDefault();
      try {
          await api.post('/shops', newShop);
          setNewShop({ name: '', description: '', address: '', latitude: 12.9716, longitude: 77.5946 });
          fetchData();
      } catch (err) {
          console.error(err);
      }
  };

  const handleCreateProduct = async (e) => {
      e.preventDefault();
      try {
          const formData = new FormData();
          formData.append('name', newProduct.name);
          formData.append('description', newProduct.description);
          formData.append('price', newProduct.price);
          formData.append('stock', newProduct.stock);
          if (productImage) {
              formData.append('image', productImage);
          }

          await api.post(`/products/shop/${selectedShop.id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          setNewProduct({ name: '', description: '', price: '', stock: '' });
          setProductImage(null);
          fetchProducts(selectedShop.id);
      } catch (err) {
          console.error(err);
      }
  }

  const selectShopMode = (shop) => {
      setSelectedShop(shop);
      setProducts([]);
      fetchProducts(shop.id);
  }

  if (!user || user.role !== 'seller') {
    return <Navigate to="/login" />;
  }

  if (loading) return <div className="text-center mt-20 animate-pulse text-brand-500 font-bold">Loading dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Seller Dashboard</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
              <button 
                  onClick={() => { setActiveTab('orders'); setSelectedShop(null); }}
                  className={`px-6 py-2 outline-none rounded-md font-bold text-sm transition-colors ${activeTab === 'orders' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  Live Orders
              </button>
              <button 
                  onClick={() => { setActiveTab('shops'); setSelectedShop(null); }}
                  className={`px-6 py-2 outline-none rounded-md font-bold text-sm transition-colors ${activeTab === 'shops' ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                  My Shops
              </button>
          </div>
      </div>

      {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
                <Package className="w-5 h-5 text-gray-500 mr-2"/>
                <h2 className="font-bold text-lg text-gray-800">Recent Orders</h2>
            </div>
            {orders.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No recent orders.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                {orders.map(order => (
                    <li key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                            <div className="mb-4 md:mb-0 flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="font-bold text-lg text-gray-900 mr-3">Order #{order.id}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${order.status === 'placed' ? 'bg-yellow-100 text-yellow-700' : 
                                          order.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 
                                          'bg-green-100 text-green-700'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium tracking-wide">Customer: {order.customer_name} • Shop: {order.shop_name}</p>
                                <p className="text-sm text-gray-500 mt-1">Amount: <span className="font-extrabold text-brand-600">₹{order.total_amount}</span></p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {order.status === 'placed' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'accepted'); }}
                                        className="bg-brand-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-brand-600 transition-colors"
                                    >
                                        Accept Order
                                    </button>
                                )}
                                <div className="text-gray-400">
                                    {expandedOrder === order.id ? <ChevronUp className="w-6 h-6"/> : <ChevronDown className="w-6 h-6"/>}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Items Area */}
                        {expandedOrder === order.id && order.items && (
                            <div className="bg-gray-50 p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
                                <h4 className="font-bold text-gray-800 flex items-center mb-4"><Package className="w-4 h-4 mr-2 text-brand-500"/> Items inside package</h4>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                                        <li key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start">
                                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden mr-3">
                                                <img src={item.image && item.image.startsWith('http') ? item.image : (item.image ? `http://localhost:5000${item.image}` : `https://ui-avatars.com/api/?name=${item.name}`)} 
                                                     className="w-full h-full object-cover" alt={item.name} />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h5>
                                                <div className="flex items-center mt-2 justify-between">
                                                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">Qty: {item.qty}</span>
                                                    <div className="flex items-center bg-green-50 px-2 py-1 rounded border border-green-200">
                                                        <Tag className="w-3 h-3 text-green-600 mr-1"/>
                                                        <span className="text-green-700 font-bold text-xs font-mono">₹{item.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                ))}
                </ul>
            )}
          </div>
      )}

      {activeTab === 'shops' && !selectedShop && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center">
                    <Store className="w-6 h-6 mr-2 text-brand-500"/>
                    Your Shops
                </h2>
                {shops.length === 0 ? (
                    <p className="text-gray-500">You haven't added any shops yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {shops.map(shop => (
                            <li key={shop.id} onClick={() => selectShopMode(shop)} className="bg-gray-50 rounded-xl p-4 border border-gray-200 cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{shop.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1">{shop.address}</p>
                                    </div>
                                    <button className="text-sm bg-white px-3 py-1 font-bold text-brand-500 rounded-md border border-brand-100">
                                        Manage
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center">
                    <Plus className="w-6 h-6 mr-2 text-brand-500"/>
                    Add New Shop
                </h2>
                <form onSubmit={handleCreateShop} className="space-y-4">
                    <input type="text" placeholder="Shop Name" required 
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                        value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})} 
                    />
                    <textarea placeholder="Description" required 
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                        value={newShop.description} onChange={e => setNewShop({...newShop, description: e.target.value})}
                    />
                    <textarea placeholder="Full Address" required 
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                        value={newShop.address} onChange={e => setNewShop({...newShop, address: e.target.value})}
                    />
                    
                    <div className="w-full">
                        <label className="block font-bold text-sm text-gray-700 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-brand-500"/>
                            Pin exact shop location
                        </label>
                        <div className="h-48 w-full rounded-xl overflow-hidden shadow-inner border-2 border-gray-200">
                            <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker />
                            </MapContainer>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">Click on the map to place the marker at your store's exact address.</p>
                    </div>

                    <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                        Create Shop
                    </button>
                </form>
             </div>
          </div>
      )}

      {activeTab === 'shops' && selectedShop && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                  onClick={() => setSelectedShop(null)}
                  className="flex items-center text-gray-500 hover:text-brand-600 font-bold mb-6 transition-colors"
               >
                   <ArrowLeft className="w-5 h-5 mr-1"/> Back to Shops
               </button>
               
               <div className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-8">
                   <h2 className="text-2xl font-extrabold text-brand-900 mb-1">{selectedShop.name}</h2>
                   <p className="text-brand-600 font-medium">{selectedShop.address}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                       <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center">
                           <Tag className="w-5 h-5 mr-2 text-brand-500"/>
                           Products in this Shop
                       </h2>
                       {products.length === 0 ? (
                           <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                               No products added yet.
                           </div>
                       ) : (
                           <ul className="space-y-4">
                               {products.map(prod => (
                                   <li key={prod.id} className="flex border border-gray-100 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                                            <img src={prod.image_url.startsWith('http') ? prod.image_url : `http://localhost:5000${prod.image_url}`} className="w-full h-full object-cover" alt="product"/>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{prod.name}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-1 mb-1">{prod.description}</p>
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-brand-600">₹{prod.price}</span>
                                                <span className="text-gray-500 bg-gray-100 px-2 rounded-md">Stock: {prod.stock}</span>
                                            </div>
                                        </div>
                                   </li>
                               ))}
                           </ul>
                       )}
                   </div>

                   <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center">
                            <Plus className="w-5 h-5 mr-2 text-brand-500"/>
                            Add New Product
                        </h2>
                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <input type="text" placeholder="Product Name" required 
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                                value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                            />
                            <textarea placeholder="Description" required 
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                                value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" step="0.01" placeholder="Price (₹)" required 
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                                    value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                                />
                                <input type="number" placeholder="Initial Stock" required 
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
                                    value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Product Photo</label>
                                <input type="file" accept="image/*"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 font-medium text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
                                    onChange={e => setProductImage(e.target.files[0])}
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-brand-500/50 hover:bg-brand-600 transition-all mt-4">
                                Add Product
                            </button>
                        </form>
                   </div>
               </div>
          </div>
      )}

    </div>
  );
}
