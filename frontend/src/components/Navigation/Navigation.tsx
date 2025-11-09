import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import { AuthService } from '../../services/auth.service';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const { user, loading } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/');
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
  }, [showDropdown]);

  if (loading) {
    return null;
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/ToeGetherLogo.png" alt="ToeGether Logo" className="nav-logo-image" />
          <span>ToeGether</span>
        </Link>
        {user && (
          <div className="nav-center-links">
              <Link
                to="/swipe"
              className={`nav-text-link ${location.pathname === '/swipe' ? 'nav-text-link--active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/chat"
              className={`nav-text-link ${location.pathname === '/chat' ? 'nav-text-link--active' : ''}`}
              >
                Chat
              </Link>
          </div>
        )}
        <div className="nav-right">
          {user ? (
            <div className="nav-profile-dropdown" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`nav-link nav-link--profile ${location.pathname === '/profile' ? 'nav-link--active' : ''}`}
                title="Profile"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar nav-avatar--placeholder">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showDropdown && (
                <div className="nav-dropdown-menu">
                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
              </Link>
              <button
                onClick={handleLogout}
                    className="nav-dropdown-item nav-dropdown-item--logout"
              >
                Logout
              </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-links">
              <Link
                to="/login"
                className={`nav-link ${location.pathname === '/login' ? 'nav-link--active' : ''}`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`nav-link nav-link--signup ${location.pathname === '/signup' ? 'nav-link--active' : ''}`}
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

