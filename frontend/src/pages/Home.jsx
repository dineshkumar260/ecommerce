import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Compass } from 'lucide-react';
import api from '../api';

export default function Home() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
            console.error("Location error", error);
            fetchShops(); // Fetch all if location fails
        }
      );
    } else {
        fetchShops();
    }
  }, []);

  useEffect(() => {
    if (location) {
        fetchShops(location.lat, location.lng);
    }
  }, [location]);

  const fetchShops = async (lat, lng) => {
      setLoading(true);
      try {
          const params = (lat && lng) ? { lat, lng, radius: 15 } : {};
          const res = await api.get('/shops/nearby', { params });
          setShops(res.data);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const loadRandomImg = (seed) => `https://picsum.photos/seed/${seed}/500/300`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-900 tracking-tight">
                Anything, Delivered <span className="text-brand-500">Instantly</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                Fresh groceries, hot food, or daily essentials. Find the best shops near you and get it delivered in minutes.
            </p>
            {location && (
                <div className="inline-flex items-center text-brand-600 bg-brand-100 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                    <MapPin className="w-4 h-4 mr-2" /> Showing nearby shops
                </div>
            )}
        </header>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl h-64 border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {shops.map(shop => (
                    <Link to={`/shop/${shop.id}`} key={shop.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                        <div className="h-48 overflow-hidden">
                            <img 
                                src={loadRandomImg(shop.name)} 
                                alt={shop.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{shop.name}</h3>
                                {shop.distance && (
                                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-md flex items-center">
                                        <Compass className="w-3 h-3 mr-1"/>
                                        {Math.round(shop.distance)} km
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{shop.description}</p>
                            <p className="text-sm font-semibold flex items-center text-gray-400">
                                <Navigation className="w-4 h-4 mr-1 text-gray-400" />
                                {shop.address}
                            </p>
                        </div>
                    </Link>
                ))}
                {shops.length === 0 && (
                    <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-lg">No shops found near your location.</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}
