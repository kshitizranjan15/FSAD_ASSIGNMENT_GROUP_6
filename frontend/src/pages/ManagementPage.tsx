// src/pages/ManagementPage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Settings, ChartBar, ListChecks, RotateCcw } from 'lucide-react';

// This component uses the role from the AuthContext to render role-specific management tools.
const ManagementPage: React.FC = () => {
  const { userRole } = useAuth();
  
  if (!userRole || userRole === 'student') {
    // Student users are redirected to the dashboard, or shown an unauthorized message
    return (
        <div className="p-8 max-w-4xl mx-auto bg-white shadow-lg rounded-xl mt-10 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
            <p className="text-lg text-gray-600">Your role ({userRole || 'Unknown'}) does not permit access to this maintenance portal.</p>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white shadow-lg rounded-xl mt-10">
      <h1 className="text-4xl font-extrabold mb-6 border-b pb-2 text-gray-900">
        <span className='capitalize'>{userRole}</span> Management Portal
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        Use the tabs below to manage {userRole === 'admin' ? 'users, equipment, requests, and view analytics.' : 'lending requests and equipment returns.'}
      </p>

      {/* --- Admin-Specific Tools --- */}
      {userRole === 'admin' && (
        <div className="mb-10 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-800 mb-4 flex items-center"><Settings className='w-6 h-6 mr-2' /> Admin-Only Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard icon={<UserPlus className='w-6 h-6' />} title="User Account Management" description="Create, view, and manage all user accounts and roles." />
            <ActionCard icon={<Settings className='w-6 h-6' />} title="Equipment & Category CRUD" description="Add, modify, and delete equipment and lending categories." />
            <ActionCard icon={<ChartBar className='w-6 h-6' />} title="Usage & Repair Analytics" description="View top-requested items, average duration, and manage repair logs." />
            {/* The actual implementation would replace ActionCard with a full component, e.g., <UserManagement /> */}
          </div>
        </div>
      )}

      {/* --- Staff/Admin Tools (Lending Management) --- */}
      {(userRole === 'admin' || userRole === 'staff') && (
        <div className="p-6 bg-green-50 rounded-xl border border-green-200">
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center"><ListChecks className='w-6 h-6 mr-2' /> Lending Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard 
                icon={<ListChecks className='w-6 h-6' />} 
                title="Pending Requests Review" 
                description="Review, approve, or reject new loan requests from students/staff. (POST/PUT /lending/request/{id}/approve)" 
            />
            <ActionCard 
                icon={<RotateCcw className='w-6 h-6' />} 
                title="Track Returns & Overdue" 
                description="Mark items as returned and check for overdue loans. (GET /lending/overdue)" 
            />
          </div>
        </div>
      )}

    </div>
  );
};

// Helper component for cleaner structure
const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start p-4 bg-white rounded-lg shadow hover:shadow-md transition">
        <div className="text-blue-500 mr-4 mt-1">{icon}</div>
        <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);


export default ManagementPage;