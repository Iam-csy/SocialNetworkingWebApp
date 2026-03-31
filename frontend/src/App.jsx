import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './redux/store';
import { fetchCurrentUser } from './redux/slices/authSlice';

import Navbar from './components/layout/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PeoplePage from './pages/PeoplePage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const { token, initialized } = useSelector(state => state.auth);
  if (!initialized) return <div className="loading-center"><div className="spinner" /></div>;
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { token } = useSelector(state => state.auth);
  return token ? <Navigate to="/" replace /> : children;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector(state => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchCurrentUser());
    } else if (!token) {
      // Mark as initialized so routes can render
      store.dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, [token, dispatch]);

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      {token && !isAuthPage && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/people" element={<PrivateRoute><PeoplePage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </Provider>
);

export default App;
