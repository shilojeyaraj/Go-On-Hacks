import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Match: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to chat page
    navigate('/chat', { replace: true });
  }, [navigate]);

  return null;
};
