import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../../components/Navigation/Navigation';
import { Button } from '../../components/Button/Button';
import { useAuthUser } from '../../hooks/useAuthUser';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useAuthUser();

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="loading">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="home-landing">
        <div className="home-content">
          <h1 className="home-logo">ToeGether</h1>
          <p className="home-tagline">with someone who feets you</p>
          <p className="home-description">Set your preferences</p>
          <p className="home-description">Find your perfect match</p>
          <p className="home-description">Start connecting today</p>
          <Button 
            onClick={() => navigate('/signup')} 
            variant="primary"
            className="home-cta-button"
          >
            Start your adventure
          </Button>
        </div>
      </div>
    </>
  );
};


