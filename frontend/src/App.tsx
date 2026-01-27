import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login, Register, Onboarding } from './pages/Auth';
import { PdfTools } from './pages/PdfTools';
import { ImageConverter } from './pages/ImageConverter';
import { NotesCalendar } from './pages/NotesCalendar';
import { CgpaCalculator } from './pages/CgpaCalculator';
import { Profile } from './pages/Profile';
import { Timetable } from './pages/Timetable';
import './index.css';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if user hasn't completed it
  if (user && !user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Auth Route wrapper (redirect if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    // If authenticated but not onboarded, go to onboarding
    if (user && !user.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/pdf-tools" replace />;
  }

  return <>{children}</>;
};

// Onboarding Route wrapper (only for authenticated users who need onboarding)
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If already onboarded, redirect to app
  if (user && user.isOnboarded) {
    return <Navigate to="/pdf-tools" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />

      {/* Onboarding Route */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/pdf-tools" replace />} />
        <Route path="pdf-tools" element={<PdfTools />} />
        <Route path="image-converter" element={<ImageConverter />} />
        <Route path="notes" element={<NotesCalendar />} />
        <Route path="cgpa" element={<CgpaCalculator />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
