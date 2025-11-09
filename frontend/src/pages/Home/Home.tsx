import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../../components/Navigation/Navigation';
import { Button } from '../../components/Button/Button';
import { useAuthUser } from '../../hooks/useAuthUser';
import './Home.css';

const COLLAGE_IMAGES = [
  '/secret-folder/secret-1.jpg',  // Top left
  '/secret-folder/secret-2.png',  // Bottom left
  '/secret-folder/secret-3.png',  // Top middle
  '/secret-folder/secret-4.png',  // Middle bottom
  '/secret-folder/secret-5.png',  // Top right
  '/secret-folder/secret-6.png'   // Bottom right
];

const BENEFITS = [
  {
    title: 'Make Your Profile',
    description: 'Create a profile to chat with others. Show off your personality and find people who share your passions.'
  },
  {
    title: 'Start Chatting',
    description: 'Connect and start chatting with feet enthusiasts. Build meaningful connections with like-minded people.'
  },
  {
    title: 'Be Genuine & Have Fun',
    description: 'Be yourself and have fun with other feet enthusiasts. Enjoy authentic connections in a welcoming community.'
  }
];

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
      <div className="home-page">
        {/* Hero Section */}
        <section className="home-hero">
          {/* Feet Collage Background */}
          <div className="home-collage-background">
            <div className="home-collage-item" style={{ gridColumn: '1', gridRow: '1' }}>
              <img src={COLLAGE_IMAGES[0]} alt="Feet 1" />
            </div>
            <div className="home-collage-item" style={{ gridColumn: '1', gridRow: '2' }}>
              <img src={COLLAGE_IMAGES[1]} alt="Feet 2" />
            </div>
            <div className="home-collage-item" style={{ gridColumn: '2', gridRow: '1' }}>
              <img src={COLLAGE_IMAGES[2]} alt="Feet 3" />
            </div>
            <div className="home-collage-item" style={{ gridColumn: '2', gridRow: '2' }}>
              <img src={COLLAGE_IMAGES[3]} alt="Feet 4" />
            </div>
            <div className="home-collage-item" style={{ gridColumn: '3', gridRow: '1' }}>
              <img src={COLLAGE_IMAGES[4]} alt="Feet 5" />
            </div>
            <div className="home-collage-item" style={{ gridColumn: '3', gridRow: '2' }}>
              <img src={COLLAGE_IMAGES[5]} alt="Feet 6" />
            </div>
          </div>

          <div className="home-hero-content">
            <div className="home-hero-center">
              <h1 className="home-logo">ToeGether</h1>
              <p className="home-tagline">find someone who <span className="text-red">feets</span> you</p>
              <Button 
                onClick={() => navigate('/signup')} 
                variant="primary"
                className="home-cta-button"
              >
                Create Account
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="home-benefits">
          <div className="home-benefits-container">
            <h2 className="home-benefits-title">Why ToeGether?</h2>
            <p className="home-benefits-subtitle">The perfect match for foot enthusiasts</p>
            
            <div className="home-benefits-list">
              {BENEFITS.map((benefit, index) => (
                <React.Fragment key={index}>
                  <div className="home-benefit-item">
                    <div className="home-benefit-bullet">👣</div>
                    <div className="home-benefit-content">
                      <h3 className="home-benefit-title">{benefit.title}</h3>
                      <p className="home-benefit-description">{benefit.description}</p>
                    </div>
                  </div>
                  {index < BENEFITS.length - 1 && (
                    <div className="home-benefit-connector"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="home-cta-section">
          <div className="home-cta-content">
            <h2 className="home-cta-heading">Ready to Find Your Sole Mate?</h2>
            <p className="home-cta-text">
              Join thousands of feet enthusiasts on ToeGether. Your perfect match is waiting!
            </p>
            <Button 
              onClick={() => navigate('/signup')} 
              variant="primary"
              className="home-cta-final-button"
            >
              Join ToeGether Today
            </Button>
            <p className="home-cta-subtext">Free to sign up • Start connecting instantly</p>
          </div>
        </section>
      </div>
    </>
  );
};
