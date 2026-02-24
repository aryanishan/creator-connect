import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiMessageSquare,
  FiUser,
  FiLogOut,
  FiPlusSquare,
  FiSearch,
  FiCreditCard
} from 'react-icons/fi';
import brandLogo from '../assets/creatorconnect-logo.svg';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarLinks = [
    { to: '/', label: 'Home', icon: FiHome, isActive: location.pathname === '/' },
    { to: '/connections', label: 'Connections', icon: FiUsers, isActive: location.pathname === '/connections' },
    { to: '/messages', label: 'Messages', icon: FiMessageSquare, isActive: location.pathname.includes('/messages') },
    { to: '/profile', label: 'Profile', icon: FiUser, isActive: location.pathname === '/profile' },
    { to: '/assets/create', label: 'Create Asset', icon: FiPlusSquare, isActive: location.pathname === '/assets/create' },
    { to: '/tokens/buy', label: 'Buying Tokens', icon: FiCreditCard, isActive: location.pathname === '/tokens/buy' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <img src={brandLogo} alt="CreatorConnect logo" className="navbar-logo-icon" />
            <span className="logo-gradient">CreatorConnect</span>
          </Link>

          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search creators, assets, or messages"
              aria-label="Search"
            />
          </form>

          <div className="navbar-right">
            <div className="user-info">
              <img
                src={user?.avatar || 'https://via.placeholder.com/40'}
                alt={user?.name}
                className="user-avatar"
              />
              <span className="user-name">{user?.name}</span>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut className="logout-icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <aside className="sidebar">
        <div className="sidebar-links">
          {sidebarLinks.map(({ to, label, icon: Icon, isActive }) => (
            <Link key={to} to={to} className={`sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="sidebar-icon" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
