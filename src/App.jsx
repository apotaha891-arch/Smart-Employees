import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import AgentTemplates from './components/AgentTemplates';
import InterviewRoom from './components/InterviewRoom';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Pricing from './components/Pricing';
import CustomRequest from './components/CustomRequest';
import Login from './components/Login';
import BusinessSetup from './components/BusinessSetup';
import AdminDashboard from './components/AdminDashboard';
import PlatformConcierge from './components/PlatformConcierge';
import SalonSetup from './components/SalonSetup';
import ModernDashboardLayout from './components/ModernDashboardLayout';
import Bookings from './components/Bookings';
import Customers from './components/Customers';
import { useLocation } from 'react-router-dom';


function App() {
    return (
        <LanguageProvider>
            <Router>
                <AppContent />
            </Router>
        </LanguageProvider>
    );
}

function AppContent() {
    const location = useLocation();
    // Routes that use the new Dashboard Layout
    const dashboardRoutes = ['/dashboard', '/setup', '/salon-setup', '/templates', '/pricing', '/bookings', '/customers'];
    const isDashboard = dashboardRoutes.includes(location.pathname);

    return (
        <div className="App">
            {!isDashboard && <Navbar />}

            <Routes>
                {/* Public / Standard Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/custom-request" element={<CustomRequest />} />
                <Route path="/interview" element={<InterviewRoom />} />
                <Route path="/reports" element={<Reports />} />

                {/* Dashboard Routes (Wrapped) */}
                <Route path="/setup" element={<ModernDashboardLayout><BusinessSetup /></ModernDashboardLayout>} />
                <Route path="/salon-setup" element={<ModernDashboardLayout><SalonSetup /></ModernDashboardLayout>} />
                <Route path="/templates" element={<ModernDashboardLayout><AgentTemplates /></ModernDashboardLayout>} />
                <Route path="/pricing" element={<ModernDashboardLayout><Pricing /></ModernDashboardLayout>} />
                <Route path="/dashboard" element={<ModernDashboardLayout><Dashboard /></ModernDashboardLayout>} />
                <Route path="/bookings" element={<ModernDashboardLayout><Bookings /></ModernDashboardLayout>} />
                <Route path="/customers" element={<ModernDashboardLayout><Customers /></ModernDashboardLayout>} />

            </Routes>

            <PlatformConcierge />
        </div>
    );
}

export default App;
