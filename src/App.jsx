import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Scroll to top on every route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}
import { LanguageProvider } from './LanguageContext';
import { createAuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import ProtectedRoute, { AgencyRoute } from './components/shared/ProtectedRoute';
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
import ResetPassword from './components/ResetPassword';
import PlatformConcierge from './components/PlatformConcierge';
import EntitySetup from './components/EntitySetup';
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
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import Footer from './components/Footer';
import AgencyDashboard from './components/AgencyDashboard';
import OpportunityLanding from './components/academy/OpportunityLanding';
import TrainingBag from './components/academy/TrainingBag';

// Create AuthProvider
const AuthProvider = createAuthProvider();


function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <BrandingProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <ScrollToTop />
                        <AppContent />
                    </Router>
                </BrandingProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

function AppContent() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    
    // Routes that ALWAYS use the Dashboard Layout
    const alwaysDashboardRoutes = ['/dashboard', '/agency', '/setup', '/entity-setup', '/contract', '/bookings', '/customers', '/deploy-agent', '/agents', '/hire-agent', '/help', '/sales', '/support', '/hr'];
    
    // Routes that use Dashboard Layout ONLY when logged in
    const hybridRoutes = ['/templates', '/interview', '/pricing'];
    
    const isDashboard = alwaysDashboardRoutes.includes(location.pathname) || (hybridRoutes.includes(location.pathname) && isAuthenticated);

    const isAcademy = location.pathname.startsWith('/opportunity') || location.pathname.startsWith('/academy');
    
    return (
        <div className="App">
            {!isAcademy && <Navbar />}

            <Routes>
                {/* ============ PUBLIC ROUTES ============ */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/custom-request" element={<CustomRequest />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/interview" element={isDashboard ? <ModernDashboardLayout><InterviewRoom /></ModernDashboardLayout> : <InterviewRoom />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/templates" element={isDashboard ? <ModernDashboardLayout><AgentTemplates /></ModernDashboardLayout> : <AgentTemplates />} />
                <Route path="/pricing" element={isDashboard ? <ModernDashboardLayout><Pricing /></ModernDashboardLayout> : <Pricing />} />
                <Route path="/onboarding" element={<ProtectedRoute requiredRole="customer"><OnboardingSector /></ProtectedRoute>} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/opportunity" element={<OpportunityLanding />} />
                <Route path="/academy" element={<TrainingBag />} />
                <Route path="/academy/bag" element={<TrainingBag />} />

                {/* ============ ADMIN PROTECTED ROUTES ============ */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* ============ AGENCY PROTECTED ROUTES ============ */}
                {/* AgencyRoute is a strict guard - only is_agency=true users can enter */}
                <Route
                    path="/agency"
                    element={
                        <AgencyRoute>
                            <AgencyDashboard />
                        </AgencyRoute>
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
                    path="/entity-setup"
                    element={
                        <ProtectedRoute requiredRole="customer">
                            <ModernDashboardLayout><EntitySetup /></ModernDashboardLayout>
                        </ProtectedRoute>
                    }
                />
                <Route path="/salon-setup" element={<Navigate to="/entity-setup" replace />} />
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
                    element={<Navigate to="/entity-setup?tab=integrations" replace />}
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

            {!isDashboard && !isAcademy && <Footer />}
            <PlatformConcierge />
        </div>
    );
}

export default App;
