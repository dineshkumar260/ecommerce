import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'customer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="glassmorphism rounded-2xl p-8 w-full max-w-md shadow-2xl transition-all">
        <h2 className="text-3xl font-extrabold text-brand-900 mb-6 text-center">Join HyperLocal</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium animate-pulse">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input 
              name="name" type="text" onChange={handleChange} required 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input 
              name="email" type="email" onChange={handleChange} required 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input 
              name="phone" type="text" onChange={handleChange} required 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              name="password" type="password" onChange={handleChange} required 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">I want to...</label>
            <select 
              name="role" onChange={handleChange} value={formData.role}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium text-gray-700 bg-white"
            >
              <option value="customer">Order items</option>
              <option value="seller">Sell items</option>
              <option value="delivery">Deliver items</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg mt-4 transform transition hover:-translate-y-1 hover:shadow-brand-500/50 flex justify-center items-center"
          >
            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm font-medium">
          Already have an account? <Link to="/login" className="text-brand-600 hover:text-brand-800 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
