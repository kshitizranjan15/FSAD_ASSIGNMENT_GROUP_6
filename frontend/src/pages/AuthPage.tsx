// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/apiClient';
import { RoleType, AuthResponse } from '../types/models'; // Import RoleType and AuthResponse
import Notification from '../components/Notification'; // Assuming this component exists
import { LogIn, UserPlus, Home } from 'lucide-react';

// --- Interface for a generic success message during signup ---
interface MessageResponse {
    message: string;
    // Assuming successful signup returns a UserBase structure which includes role, id, name.
    // However, since the API only returns message, we rely on the notification.
}

// Combined type for what the API might return successfully
type AuthApiData = AuthResponse | MessageResponse | object;


const AuthPage: React.FC = () => {
  const { setAuth, isLoggedIn, userRole, logout } = useAuth(); // Added logout for easy use
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone_number: '',
    role: 'student' as RoleType, // Default role for signup
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    const endpoint = isLoginView ? '/users/login' : '/users/signup';
    const data = isLoginView
      ? { username: formData.username, password: formData.password }
      : { 
          username: formData.username, 
          password: formData.password, 
          full_name: formData.full_name, 
          email: formData.email, 
          phone_number: formData.phone_number,
          role: formData.role
        };

    try {
      const response = await apiCall<AuthApiData>(endpoint, 'POST', data);

      if (isLoginView) {
        // --- FIX: Ensure the setAuth signature matches AuthContext.tsx ---
        const authData = response as AuthResponse;
        if (authData.access_token && authData.role && authData.user_id && authData.full_name) {
          setAuth(authData.access_token, authData.role, authData.user_id, authData.full_name);
          setNotification({ message: `Login successful! Welcome, ${authData.full_name}.`, type: 'success' });
          // Clear form data on success
          setFormData({ username: '', password: '', full_name: '', email: '', phone_number: '', role: 'student' });
        } else {
          throw new Error("Invalid response from login API.");
        }
      } else {
        // Signup success (Admin-only), which returns a success message
        setNotification({ message: 'User created successfully! You can now log in.', type: 'success' });
        setIsLoginView(true); // Switch to login view after successful signup
        setFormData({ username: '', password: '', full_name: '', email: '', phone_number: '', role: 'student' });
      }

    } catch (error) {
        const errorMessage = (error as any)?.message || 'An unknown error occurred.';
        setNotification({ message: `Authentication Error: ${errorMessage}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoggedIn && userRole !== 'admin') {
    return (
        <div className="p-8 max-w-lg mx-auto bg-white shadow-xl rounded-xl mt-10 text-center">
            <Home className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 mb-4">You are logged in as a <strong className='capitalize'>{userRole}</strong>. Redirecting to dashboard...</p>
            <button
                onClick={logout}
                className="w-full mt-4 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Logout
            </button>
        </div>
    );
  }

  // Admin users can still see the login form to potentially sign up new users.
  
  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-xl rounded-xl mt-10">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        {isLoginView ? 'User Login' : 'Admin User Sign Up'}
      </h2>
      
      {/* Role-based message for Admin on the Auth Page */}
      {(isLoggedIn && userRole === 'admin') && (
        <div className='mb-4 p-3 bg-indigo-100 border border-indigo-300 text-indigo-800 rounded-lg'>
            <p className='font-semibold'>Admin Mode:</p>
            <p className='text-sm'>You are logged in. Use this page to create new user accounts.</p>
        </div>
      )}

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <form onSubmit={handleAuth} className="space-y-6">
        {/* Username and Password (Required for both) */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            onChange={handleChange}
            value={formData.username}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            onChange={handleChange}
            value={formData.password}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Signup Fields (Only visible in signup view) */}
        {!isLoginView && (
          <>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input id="full_name" name="full_name" type="text" required={!isLoginView} onChange={handleChange} value={formData.full_name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required={!isLoginView} onChange={handleChange} value={formData.email} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
              <input id="phone_number" name="phone_number" type="tel" onChange={handleChange} value={formData.phone_number} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">User Role</label>
              <select id="role" name="role" required={!isLoginView} onChange={handleChange} value={formData.role} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white">
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={() => setIsLoginView(!isLoginView)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLoginView ? 
                `Admin: Need to create a user? Sign Up` : 
                'Already have an account? Login'
              }
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isLoginView ? (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                {isLoading ? 'Logging In...' : 'Login'}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                {isLoading ? 'Creating User...' : 'Sign Up'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthPage;