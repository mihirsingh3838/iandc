import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import FacilitySelectionScreen from './screens/FacilitySelectionScreen';
import FacilitySummaryScreen from './screens/FacilitySummaryScreen';
import HomeScreen from './screens/HomeScreen';
import ICSubmissionScreen from './screens/ICSubmissionScreen';
import ICPreviewScreen from './screens/ICPreviewScreen';
import AdminDashboard from './screens/AdminDashboard';
import UserRecordsScreen from './screens/UserRecordsScreen';

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

// Route that only allows admin users
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
  
  if (user.role !== 'admin' && user.username !== 'admin') {
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
  
  if (user.role === 'admin' || user.username === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

function App() {
  return (
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
    </Routes>
  );
}

export default App;

