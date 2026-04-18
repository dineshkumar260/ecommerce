import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../api';

export default function Shop() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, cart } = useStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shopRes, prodRes] = await Promise.all([
          api.get(`/shops/${id}`),
          api.get(`/products/shop/${id}`)
        ]);
        setShop(shopRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center font-bold text-xl py-12 text-brand-500 animate-pulse">Loading shop menu...</div>;
  if (!shop) return <div className="text-center text-red-500 font-bold py-12">Shop not found</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/3 h-48 rounded-2xl overflow-hidden shadow-inner">
            <img src={`https://picsum.photos/seed/${shop.name}/600/400`} alt={shop.name} className="w-full h-full object-cover"/>
        </div>
        <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-brand-900 mb-2">{shop.name}</h1>
            <p className="text-gray-500 mb-4">{shop.address}</p>
            <p className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-medium inline-block text-sm">
                {shop.description}
            </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <ShoppingBag className="w-6 h-6 mr-2 text-brand-500"/> Menu Items
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between">
            <div>
              <div className="h-40 bg-gray-50 rounded-xl mb-4 overflow-hidden">
                <img 
                  src={product.image_url || `https://picsum.photos/seed/${product.name}/400/300`} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xl font-extrabold text-brand-600">₹{product.price}</span>
              <button 
                onClick={() => addToCart(product, shop.id)}
                className="bg-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white p-2 rounded-full transition-colors focus:ring-4 focus:ring-brand-200"
                title="Add to cart"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            No products available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
