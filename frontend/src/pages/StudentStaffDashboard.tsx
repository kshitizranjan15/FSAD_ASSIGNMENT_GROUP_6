// src/pages/StudentStaffDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/apiClient';
import { Equipment, LendingRequestCreate } from '../types/models'; // Import Equipment and LendingRequestCreate
import { Search, Loader2, ArrowRight } from 'lucide-react';
import Notification from '../components/Notification'; // Assuming this component exists

interface StudentStaffDashboardProps {
  // Use a global notification state/component if possible, but keeping the props for now
  setAppError: (msg: string | null) => void;
  setAppSuccess: (msg: string | null) => void;
}

const StudentStaffDashboard: React.FC<StudentStaffDashboardProps> = ({ setAppError, setAppSuccess }) => {
  const { token, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loanModal, setLoanModal] = useState<{ isOpen: boolean; equipmentId: number | null; equipmentName: string | null; quantity: number; returnDate: string }>({
    isOpen: false,
    equipmentId: null,
    equipmentName: null,
    quantity: 1,
    // Default return date (e.g., 7 days from now)
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);


  const fetchEquipment = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setAppError(null);
    
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search_term', searchTerm);
      if (categoryFilter) query.append('category_id', categoryFilter);

      const url = `/equipment/?${query.toString()}`;
      
      const data = await apiCall<Equipment[]>(url, 'GET', undefined, token);
      setEquipmentList(data);
      
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Failed to fetch equipment.';
      setAppError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm, categoryFilter, setAppError]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleRequestLoan = (equipmentId: number, equipmentName: string) => {
    setLoanModal({
      ...loanModal,
      isOpen: true,
      equipmentId: equipmentId,
      equipmentName: equipmentName,
    });
  };

  const submitLoanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanModal.equipmentId || !token) return;

    setLoading(true);
    setNotification(null);

    const requestData: LendingRequestCreate = {
      equipment_id: loanModal.equipmentId,
      quantity: loanModal.quantity,
      expected_return_date: loanModal.returnDate,
    };

    try {
      // API call to POST /lending/request (Accessible by Student/Staff)
      await apiCall('/lending/request', 'POST', requestData, token);
      
      setNotification({ message: 'Loan request submitted successfully! Pending approval.', type: 'success' });
      setLoanModal({ ...loanModal, isOpen: false });
      setAppSuccess('Loan request submitted successfully! Pending approval.');
      fetchEquipment(); // Refresh list to update available quantity
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Failed to submit loan request.';
      setNotification({ message: `Request Error: ${errorMessage}`, type: 'error' });
      setAppError(`Request Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        Welcome, <span className='capitalize'>{userRole}</span>! Available Equipment
      </h1>
      
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* Search and Filter Bar */}
      <div className="flex space-x-4 mb-8 bg-gray-50 p-4 rounded-lg shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">All Categories</option>
          {/* TODO: Fetch categories dynamically */}
          <option value="1">Laptops</option>
          <option value="2">Sports</option>
          <option value="3">Musical</option>
        </select>
        <button
            onClick={fetchEquipment}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 disabled:bg-gray-400"
        >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Apply Filters'}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <p className="text-lg text-blue-600">Loading Equipment...</p>
        </div>
      )}

      {!loading && equipmentList.length === 0 && (
        <p className="text-center text-lg text-gray-500 py-10">No equipment found matching your search criteria.</p>
      )}

      {!loading && equipmentList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipmentList.map(item => (
                  <div key={item.equipment_id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-3 transition transform hover:shadow-xl">
                      <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Category ID: {item.category_id}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <p className={`text-lg font-semibold ${item.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Available: {item.available_quantity} / {item.total_quantity}
                          </p>
                          <button
                              onClick={() => handleRequestLoan(item.equipment_id, item.name)}
                              disabled={item.available_quantity <= 0 || loading}
                              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                          >
                              {item.available_quantity > 0 ? (
                                <>Borrow Item <ArrowRight className='w-4 h-4 ml-1'/></>
                                ) : (
                                'Out of Stock'
                              )}
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
      
      {/* Loan Request Modal (Simplified) */}
      {loanModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Request Loan for {loanModal.equipmentName}</h2>
            <form onSubmit={submitLoanRequest} className="space-y-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={equipmentList.find(e => e.equipment_id === loanModal.equipmentId)?.available_quantity || 1}
                  value={loanModal.quantity}
                  onChange={(e) => setLoanModal({ ...loanModal, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">Expected Return Date</label>
                <input
                  id="returnDate"
                  type="date"
                  value={loanModal.returnDate}
                  onChange={(e) => setLoanModal({ ...loanModal, returnDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setLoanModal({ ...loanModal, isOpen: false })}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStaffDashboard;