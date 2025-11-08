import React from 'react';
import { Navigation } from '../../components/Navigation/Navigation';

export const Profile: React.FC = () => {
  return (
    <>
      <Navigation />
      <div className="container">
        <div className="card card--medium card--centered">
          <h1 className="text-title text-center">Profile</h1>
          <p className="text-body">Coming soon...</p>
        </div>
      </div>
    </>
  );
};

