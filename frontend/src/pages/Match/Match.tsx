import React from 'react';
import { Navigation } from '../../components/Navigation/Navigation';

export const Match: React.FC = () => {
  return (
    <>
      <Navigation />
      <div className="container">
        <div className="card card--medium card--centered">
          <h1 className="text-title text-center">Find Your Match</h1>
          <p className="text-body">Browse profiles and find your perfect match</p>
          <p className="text-body">Coming soon...</p>
        </div>
      </div>
    </>
  );
};

