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

function App() {
    return (
        <LanguageProvider>
            <Router>
                <div className="App">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/setup" element={<BusinessSetup />} />
                        <Route path="/templates" element={<AgentTemplates />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/custom-request" element={<CustomRequest />} />
                        <Route path="/interview" element={<InterviewRoom />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/reports" element={<Reports />} />
                    </Routes>
                    <PlatformConcierge />
                </div>
            </Router>
        </LanguageProvider>
    );
}

export default App;
