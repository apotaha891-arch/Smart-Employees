import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider } from './LanguageContext';
import { createAuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
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
import DeployAgent from './components/DeployAgent';
import Employees from './components/Employees';
import OnboardingSector from './components/OnboardingSector';
import ContractSign from './components/ContractSign';
import { useLocation } from 'react-router-dom';

// Create AuthProvider
const AuthProvider = createAuthProvider();


function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

function AppContent() {
    const location = useLocation();
    // Routes that use the new Dashboard Layout
    const dashboardRoutes = ['/dashboard', '/setup', '/salon-setup', '/templates', '/pricing', '/contract', '/bookings', '/customers', '/deploy-agent', '/employees'];
    const isDashboard = dashboardRoutes.includes(location.pathname);

    return (
        <div className="App">
            <Navbar />

            <Routes>
                {/* ============ PUBLIC ROUTES ============ */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/custom-request" element={<CustomRequest />} />
                <Route path="/interview" element={<InterviewRoom />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/onboarding" element={<ProtectedRoute requiredRole="customer"><OnboardingSector /></ProtectedRoute>} />

                {/* ============ ADMIN PROTECTED ROUTES ============ */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* ============ CUSTOMER PROTECTED ROUTES ============ */}
                <Route
                    path="/setup"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><BusinessSetup /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/salon-setup"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><SalonSetup /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/templates"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><AgentTemplates /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pricing"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Pricing /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/contract"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><ContractSign /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Dashboard /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/bookings"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Bookings /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/deploy-agent"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><DeployAgent /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Customers /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Employees /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>

            <PlatformConcierge />
            <Analytics />
        </div>
    );
}

export default App;
