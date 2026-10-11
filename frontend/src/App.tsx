import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore/:provinceId" element={<Explore />} />
              <Route path="/plan" element={<PlanTrip />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-trips" element={<MyTrips />} />
            </Routes>
          </main>
          <Footer />
          <ChatbotWidget />
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
