import React, { useEffect, useRef, useState } from 'react';
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
import api from '../config/api';
import brandLogo from '../assets/creatorconnect-logo.svg';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], assets: [] });
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

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

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setSearchResults({ users: [], assets: [] });
      setSearchLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [usersResponse, assetsResponse] = await Promise.all([
          api.get('/users', { params: { search: trimmed } }),
          api.get('/assets', { params: { search: trimmed } })
        ]);

        setSearchResults({
          users: (usersResponse.data || []).slice(0, 6),
          assets: (assetsResponse.data || []).slice(0, 6)
        });
      } catch (error) {
        setSearchResults({ users: [], assets: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/connections?search=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
  };

  if (!isAuthenticated) return null;

  const { users, assets } = searchResults;
  const hasResults = users.length > 0 || assets.length > 0;
  const shouldShowResults = searchOpen && searchQuery.trim().length >= 2;

  return (
    <nav className="navbar">
      <div className="navbar-container nav-shell">
        <Link to="/" className="navbar-logo">
          <img src={brandLogo} alt="CreatorConnect logo" className="navbar-logo-icon" />
          <span className="logo-gradient">CreatorConnect</span>
        </Link>

        <div className="navbar-links">
          {sidebarLinks.map(({ to, label, icon: Icon, isActive }) => (
            <Link key={to} to={to} className={`navbar-link ${isActive ? 'active' : ''}`}>
              <Icon className="navbar-link-icon" />
              <span>{label}</span>
            </Link>
          ))}
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

          <Link to="/search" className="mobile-search-trigger" aria-label="Open search">
            <FiSearch className="search-icon" />
          </Link>

          <form
            ref={searchRef}
            className={`navbar-search ${searchOpen ? 'open' : ''}`}
            onSubmit={handleSearchSubmit}
          >
            <button type="button" className="search-toggle" onClick={openSearch} aria-label="Open search">
              <FiSearch className="search-icon" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search creators or assets"
              aria-label="Search creators and assets"
            />

            {shouldShowResults && (
              <div className="search-results" role="listbox" aria-label="Search results">
                {searchLoading ? (
                  <p className="search-status">Searching...</p>
                ) : hasResults ? (
                  <>
                    {users.length > 0 && (
                      <div className="result-group">
                        <h4>Creators</h4>
                        {users.map((person) => (
                          <button
                            type="button"
                            key={person._id}
                            className="result-item"
                            onClick={() => {
                              navigate(`/connections?search=${encodeURIComponent(person.name)}`);
                              setSearchOpen(false);
                            }}
                          >
                            <img src={person.avatar} alt={person.name} />
                            <span>{person.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {assets.length > 0 && (
                      <div className="result-group">
                        <h4>Assets</h4>
                        {assets.map((asset) => (
                          <button
                            type="button"
                            key={asset._id}
                            className="result-item"
                            onClick={() => {
                              navigate(`/assets/${asset._id}`);
                              setSearchOpen(false);
                            }}
                          >
                            <img
                              src={asset.media?.[0]?.url || 'https://via.placeholder.com/40'}
                              alt={asset.title}
                            />
                            <span>{asset.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="search-status">No matching creators or assets.</p>
                )}
              </div>
            )}
          </form>

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
