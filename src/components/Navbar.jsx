import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span className="text-xl font-bold gradient-text">EcoTravel</span>
          </Link>

          {/* Navigation Links */}
          {currentUser && (
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/add-trip"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Add Trip
              </Link>
              <Link
                to="/history"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                History
              </Link>
              <Link
                to="/groups"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium flex items-center gap-1"
              >
                👥 Groups
              </Link>
              <Link
                to="/leaderboard"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Leaderboard
              </Link>
              <Link
                to="/rewards"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Rewards
              </Link>
              <Link
                to="/profile"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-all"
              >
                Logout
              </button>
            </div>
          )}

          {!currentUser && (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
