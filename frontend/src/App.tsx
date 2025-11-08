import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentStaffDashboard from './pages/StudentStaffDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Notification from './components/Notification';
import { LogOut, Home, Settings } from 'lucide-react';
import type { RoleType } from './types/models';

const normalizeRole = (r?: RoleType | null) => (r ? String(r).toLowerCase() : '');
const capitalize = (s?: RoleType | null) => (!s ? '' : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());

const NavBar: React.FC = () => {
  const { isLoggedIn, userRole, logout, fullName } = useAuth();
  const nr = normalizeRole(userRole);

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          Lending Portal
        </Link>
        <div className="flex items-center space-x-4">
          {isLoggedIn && (
            <>
              <p className="text-gray-300 text-sm hidden sm:block">
                Logged in as:{' '}
                <strong className="capitalize">
                  {fullName} ({capitalize(userRole)})
                </strong>
              </p>

              <Link to="/" className="text-gray-300 hover:text-white flex items-center">
                <Home className="w-5 h-5 mr-1" /> Dashboard
              </Link>

              {(nr === 'admin' || nr === 'staff') && (
                <Link to="/manage" className="text-gray-300 hover:text-white flex items-center">
                  <Settings className="w-5 h-5 mr-1" /> Management
                </Link>
              )}

              <button
                onClick={logout}
                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm flex items-center transition"
              >
                <LogOut className="w-4 h-4 mr-1" /> Logout
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

const Unauthorized: React.FC<{ required?: RoleType[] }> = ({ required }) => {
  const pretty = required?.map((r) => capitalize(r)).join(', ');
  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-2">Unauthorized</h2>
      <p className="text-gray-600 mb-4">
        You don't have permission to view this page{required ? ` (requires: ${pretty})` : ''}.
      </p>
      <Link to="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">
        Back to Dashboard
      </Link>
    </div>
  );
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: RoleType[];
}> = ({ children, allowedRoles }) => {
  const { isLoggedIn, userRole } = useAuth();

  if (!isLoggedIn) return <Navigate to="/auth" replace />;

  if (allowedRoles && userRole) {
    const normalizedUser = normalizeRole(userRole);
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());
    if (!normalizedAllowed.includes(normalizedUser)) {
      return <Unauthorized required={allowedRoles} />;
    }
  }

  return <>{children}</>;
};


const RoleBasedHome: React.FC<{
  setAppError: (s: string | null) => void;
  setAppSuccess: (s: string | null) => void;
}> = ({ setAppError, setAppSuccess }) => {
  const { isLoggedIn, userRole } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  const nr = normalizeRole(userRole);

  if (nr === 'admin') {
    return (
      <ProtectedRoute allowedRoles={['Admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    );
  }

  if (nr === 'staff') {
    return (
      <ProtectedRoute allowedRoles={['Staff']}>
        <StaffDashboard />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <StudentStaffDashboard setAppError={setAppError} setAppSuccess={setAppSuccess} />
    </ProtectedRoute>
  );
};

const AppContent: React.FC = () => {
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
            onClose={() => {
              setAppError(null);
              setAppSuccess(null);
            }}
          />
        </div>
      )}

      <Routes>
        {/* Public */}
        <Route path="/auth" element={isLoggedIn ? <Navigate to="/" replace /> : <AuthPage />} />

        <Route path="/" element={<RoleBasedHome setAppError={setAppError} setAppSuccess={setAppSuccess} />} />

        <Route
          path="/manage"
          element={
            <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
              {/* <ManagementPage /> */}
              <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Management</h2>
                <p className="text-gray-600 mt-2">Management UI goes here (staff & admin only).</p>
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
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
