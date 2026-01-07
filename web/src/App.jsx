import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';

// Lazy load components for code splitting
const SplashScreen = lazy(() => import('./screens/SplashScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const FacilitySelectionScreen = lazy(() => import('./screens/FacilitySelectionScreen'));
const FacilitySummaryScreen = lazy(() => import('./screens/FacilitySummaryScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const ICSubmissionScreen = lazy(() => import('./screens/ICSubmissionScreen'));
const ICPreviewScreen = lazy(() => import('./screens/ICPreviewScreen'));
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'));
const UserRecordsScreen = lazy(() => import('./screens/UserRecordsScreen'));
const NotFoundScreen = lazy(() => import('./screens/NotFoundScreen'));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Route that only allows admin and vendor users
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin' && user.role !== 'vendor' && user.username !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

// Route that only allows regular users (blocks admins)
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'admin' || user.role === 'vendor' || user.username === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/facility-selection"
          element={
            <UserRoute>
              <FacilitySelectionScreen />
            </UserRoute>
          }
        />
        <Route
          path="/facility-summary"
          element={
            <UserRoute>
              <FacilitySummaryScreen />
            </UserRoute>
          }
        />
        <Route
          path="/home"
          element={
            <UserRoute>
              <HomeScreen />
            </UserRoute>
          }
        />
        <Route
          path="/ic-submission"
          element={
            <UserRoute>
              <ICSubmissionScreen />
            </UserRoute>
          }
        />
        <Route
          path="/ic-preview"
          element={
            <PrivateRoute>
              <ICPreviewScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/my-records"
          element={
            <UserRoute>
              <UserRecordsScreen />
            </UserRoute>
          }
        />
        {/* Catch-all route for 404 - must be last */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Suspense>
  );
}

export default App;

