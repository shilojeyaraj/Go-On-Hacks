import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Signup } from './pages/Signup/Signup';
import { ForgotPassword } from './pages/ForgotPassword/ForgotPassword';
import { Home } from './pages/Home/Home';
import { Match } from './pages/Match/Match';
import { Swipe } from './pages/Swipe/Swipe';
import { Chat } from './pages/Chat/Chat';
import { Profile } from './pages/Profile/Profile';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import './styles/global.css';
import './styles/components.css';
import './styles/utilities.css';

function AppRoutes() {
  const location = useLocation();

  return (
    <div className="page-transition-wrapper">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/match"
          element={
            <ProtectedRoute>
              <Match />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swipe"
          element={
            <ProtectedRoute>
              <Swipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;


