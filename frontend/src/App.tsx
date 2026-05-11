import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Feed from './pages/Feed';
import MapPage from './pages/Map';
import ListingDetail from './pages/ListingDetail';
import Search from './pages/Search';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Layout from './components/Layout';
import { GlobalNotifProvider } from './components/GlobalNotifProvider';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalNotifProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public with layout */}
          <Route path="/" element={<Layout><Feed /></Layout>} />
          <Route path="/search" element={<Layout><Search /></Layout>} />
          <Route path="/map" element={<Layout><MapPage /></Layout>} />
          <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />

          {/* Protected */}
          <Route path="/add" element={
            <Layout><ProtectedRoute><CreateListing /></ProtectedRoute></Layout>
          } />
          <Route path="/edit/:id" element={
            <Layout><ProtectedRoute><CreateListing /></ProtectedRoute></Layout>
          } />
          <Route path="/listings/new" element={<Navigate to="/add" replace />} />
          <Route path="/profile" element={
            <Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>
          } />
          <Route path="/notifications" element={
            <Layout><ProtectedRoute><Notifications /></ProtectedRoute></Layout>
          } />
          <Route path="/messages" element={
            <Layout><ProtectedRoute><Messages /></ProtectedRoute></Layout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GlobalNotifProvider>
    </BrowserRouter>
  );
}
