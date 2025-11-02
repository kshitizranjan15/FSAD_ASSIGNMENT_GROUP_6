// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentStaffDashboard from './pages/StudentStaffDashboard';
import ManagementPage from './pages/ManagementPage';
import Notification from './components/Notification'; // Assuming this component exists
import { LogOut, Home, Settings } from 'lucide-react';

// --- Shared Components ---

// Basic Navigation Header
const NavBar: React.FC = () => {
    const { isLoggedIn, userRole, logout, fullName } = useAuth();
    
    return (
        <nav className="bg-gray-800 p-4 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-white text-2xl font-bold">Lending Portal</Link>
                <div className="flex items-center space-x-4">
                    {isLoggedIn && (
                        <>
                            <p className="text-gray-300 text-sm hidden sm:block">
                                Logged in as: <strong className='capitalize'>{fullName} ({userRole})</strong>
                            </p>
                            <Link to="/" className="text-gray-300 hover:text-white flex items-center">
                                <Home className='w-5 h-5 mr-1'/> Dashboard
                            </Link>
                            {(userRole === 'admin' || userRole === 'staff') && (
                                <Link to="/manage" className="text-gray-300 hover:text-white flex items-center">
                                    <Settings className='w-5 h-5 mr-1'/> Management
                                </Link>
                            )}
                            <button onClick={logout} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm flex items-center transition">
                                <LogOut className='w-4 h-4 mr-1'/> Logout
                            </button>
                        </>
                    )}
                    {!isLoggedIn && (
                         <Link to="/auth" className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

// Private Route Wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoggedIn } = useAuth();
    return isLoggedIn ? <>{children}</> : <Navigate to="/auth" replace />;
};

// --- Main App Component ---
const AppContent: React.FC = () => {
    // Global notification state for cross-component success/error messages
    const [appError, setAppError] = useState<string | null>(null);
    const [appSuccess, setAppSuccess] = useState<string | null>(null);
    const { isLoggedIn } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            
            {(appError || appSuccess) && (
                <div className="max-w-7xl mx-auto px-4 mt-4">
                    <Notification 
                        message={appError || appSuccess || ''} 
                        type={appError ? 'error' : 'success'}
                        onClose={() => { setAppError(null); setAppSuccess(null); }}
                    />
                </div>
            )}

            <Routes>
                <Route path="/auth" element={
                    isLoggedIn ? <Navigate to="/" replace /> : <AuthPage />
                } />
                
                {/* Main Dashboard (Private) */}
                <Route path="/" element={
                    <PrivateRoute>
                        <StudentStaffDashboard setAppError={setAppError} setAppSuccess={setAppSuccess} />
                    </PrivateRoute>
                } />

                {/* Management Portal (Staff/Admin Only - Private) */}
                <Route path="/manage" element={
                    <PrivateRoute>
                        <ManagementPage />
                    </PrivateRoute>
                } />
                
                {/* Fallback Route */}
                <Route path="*" element={ <Navigate to="/" replace /> } />
            </Routes>
        </div>
    );
};


const App: React.FC = () => (
    <Router>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </Router>
);

export default App;