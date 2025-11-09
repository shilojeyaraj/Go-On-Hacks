import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../../hooks/useAuthUser';
import './SpamPopup.css';

const SPAM_MESSAGES = [
  "Toes within 50 m are tingling for you 👣💫",
  "Feet nearby can't wait to step up to you 😉👠",
  "Soles within reach are feeling the heat 🔥🦶",
  "Fifty metres away, someone's heels are already clicking 💃✨",
  "Nearby feet want to dance with yours 💞👣",
  "Someone's barefoot and bold within 50 m 😏🌡️",
  "Local soles are craving some company 🦶❤️",
  "There's toe-tapping energy around you 🎶👣",
  "Feet close by can't stop thinking about you 💭💋"
];

const SPAM_IMAGES = [
  '/spam/spam-1.jpg',
  '/spam/spam-2.jpg',
  '/spam/spam-3.png',
  '/spam/spam-4.png',
  '/spam/spam-5.jpg',
  '/spam/spam-6.jpg',
  '/spam/spam-7.jpg',
  '/spam/spam-8.jpg',
  '/spam/spam-9.jpg',
  '/spam/spam-10.jpg'
];

export const SpamPopup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState('');
  const [position, setPosition] = useState<'left' | 'right'>('right');

  const showPopup = () => {
    const randomMessage = SPAM_MESSAGES[Math.floor(Math.random() * SPAM_MESSAGES.length)];
    const randomImage = SPAM_IMAGES[Math.floor(Math.random() * SPAM_IMAGES.length)];
    const randomPosition = Math.random() > 0.5 ? 'left' : 'right';
    
    setMessage(randomMessage);
    setImage(randomImage);
    setPosition(randomPosition);
    setIsVisible(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsVisible(false);
  };

  const handleClick = () => {
    if (user) {
      navigate('/swipe');
    } else {
      navigate('/signup');
    }
    setIsVisible(false);
  };

  useEffect(() => {
    // Show first popup instantly
    showPopup();

    // Then show popup every 7 seconds
    const interval = setInterval(() => {
      showPopup();
    }, 7000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`spam-popup spam-popup--${position}`} onClick={handleClick}>
      <button className="spam-popup-close" onClick={handleClose}>×</button>
      <div className="spam-popup-content">
        <img src={image} alt="Spam" className="spam-popup-image" />
        <p className="spam-popup-message">{message}</p>
      </div>
    </div>
  );
};

