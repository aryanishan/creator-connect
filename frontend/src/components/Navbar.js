import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUsers, FiMessageSquare, FiUser, FiLogOut } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-gradient">CreatorConnect</span>
        </Link>

        <div className="nav-menu">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FiHome className="nav-icon" />
            <span>Home</span>
          </Link>

          <Link
            to="/connections"
            className={`nav-link ${location.pathname === '/connections' ? 'active' : ''}`}
          >
            <FiUsers className="nav-icon" />
            <span>Connections</span>
          </Link>

          <Link
            to="/messages"
            className={`nav-link ${location.pathname.includes('/messages') ? 'active' : ''}`}
          >
            <FiMessageSquare className="nav-icon" />
            <span>Messages</span>
          </Link>

          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <FiUser className="nav-icon" />
            <span>Profile</span>
          </Link>
        </div>

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
  );
};

export default Navbar;