import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useStore(state => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      
      if (response.data.user.role === 'seller') navigate('/seller');
      else if (response.data.user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="glassmorphism rounded-2xl p-8 w-full max-w-md shadow-2xl transition-all">
        <h2 className="text-3xl font-extrabold text-brand-900 mb-6 text-center">Welcome Back</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium animate-pulse">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
              required 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-all font-medium"
              required 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:-translate-y-1 hover:shadow-brand-500/50 flex justify-center items-center"
          >
            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm font-medium">
          Don't have an account? <Link to="/register" className="text-brand-600 hover:text-brand-800 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
