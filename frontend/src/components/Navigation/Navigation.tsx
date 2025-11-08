import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import { AuthService } from '../../services/auth.service';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const { user, loading } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/');
  };

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
        <div className="nav-links">
          {user ? (
            <>
              <Link
                to="/match"
                className={`nav-link ${location.pathname === '/match' ? 'nav-link--active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/chat"
                className={`nav-link ${location.pathname === '/chat' ? 'nav-link--active' : ''}`}
              >
                Chat
              </Link>
              <Link
                to="/profile"
                className={`nav-link nav-link--profile ${location.pathname === '/profile' ? 'nav-link--active' : ''}`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar nav-avatar--placeholder">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="nav-profile-text">Your Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="nav-link nav-link--logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

