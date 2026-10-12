import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatbotWidget } from './components/ChatbotWidget';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { PlanTrip } from './pages/PlanTrip';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MyTrips } from './pages/MyTrips';
import { AdminDashboard } from './pages/AdminDashboard';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isPlanPage = location.pathname.startsWith('/plan');

  return (
    <div className={`flex flex-col ${isPlanPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className={`flex-1 ${isPlanPage ? 'overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore/:provinceId" element={<Explore />} />
          <Route path="/plan" element={<PlanTrip />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isPlanPage && <Footer />}
      <ChatbotWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
