import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import HireAgent from './components/HireAgent';
import OnboardingSector from './components/OnboardingSector';
import ContractSign from './components/ContractSign';
import HelpCenter from './components/HelpCenter';
import SalesLeadsManager from './components/SalesLeadsManager';
import SupportTicketManager from './components/SupportTicketManager';
import HRRecruitmentManager from './components/HRRecruitmentManager';

// Create AuthProvider
const AuthProvider = createAuthProvider();


function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppContent />
                </Router>
            </AuthProvider>
        </LanguageProvider>
    );
}

function AppContent() {
    const location = useLocation();
    // Routes that use the new Dashboard Layout
    const dashboardRoutes = ['/dashboard', '/setup', '/salon-setup', '/templates', '/interview', '/pricing', '/contract', '/bookings', '/customers', '/deploy-agent', '/agents', '/hire-agent', '/help', '/sales', '/support', '/hr'];
    const isDashboard = dashboardRoutes.includes(location.pathname);

    return (
        <div className="App">
            <Navbar />

            <Routes>
                {/* ============ PUBLIC ROUTES ============ */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/custom-request" element={<CustomRequest />} />
                <Route path="/interview" element={isDashboard ? <ModernDashboardLayout><InterviewRoom /></ModernDashboardLayout> : <InterviewRoom />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/templates" element={isDashboard ? <ModernDashboardLayout><AgentTemplates /></ModernDashboardLayout> : <AgentTemplates />} />
                <Route path="/pricing" element={isDashboard ? <ModernDashboardLayout><Pricing /></ModernDashboardLayout> : <Pricing />} />
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
                    element={<Navigate to="/salon-setup?tab=integrations" replace />}
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
                    path="/agents"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><Employees /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hire-agent"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><HireAgent /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                {/* Redirect old path to new one */}
                <Route path="/employees" element={<Navigate to="/agents" replace />} />
                <Route
                    path="/help"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><HelpCenter /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sales"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><SalesLeadsManager /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/support"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><SupportTicketManager /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/hr"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><HRRecruitmentManager /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/help/:category"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><HelpCenter /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>

            <PlatformConcierge />
        </div>
    );
}

export default App;
