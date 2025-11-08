import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/apiClient';
import { Equipment } from '../types/models';
import { Loader2, AlertCircle } from 'lucide-react';
import Notification from '../components/Notification';

type TopRequestedItem = {
  equipment_name?: string;
  total_units_borrowed?: number;
  equipment_id?: number;
};

type OverdueItem = {
  request_id?: number;
  equipment_name?: string;
  borrower_name?: string;
  requester_email?: string;
  expected_return_date?: string;
};

export default function AdminDashboard() {
  const { token, fullName, logout, userRole } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [topRequested, setTopRequested] = useState<TopRequestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchEquipment = async () => {
    try {
      const data = await apiCall<Equipment[]>('/equipment', 'GET', undefined, token);
      setEquipment(data || []);
    } catch (err) {
      console.error('equipment fetch', err);
      setNotification({ message: 'Failed to load equipment', type: 'error' });
    }
  };

  const fetchOverdue = async () => {
    try {
      const data = await apiCall<OverdueItem[]>('/lending/overdue', 'GET', undefined, token);
      setOverdue(data || []);
    } catch (err) {
      console.warn('no overdue endpoint or error', err);
      setOverdue([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiCall<TopRequestedItem[]>('/analytics/usage/top-requested', 'GET', undefined, token);
      setTopRequested(data || []);
    } catch (err) {
      console.warn('analytics fetch failed', err);
      setTopRequested([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEquipment(), fetchOverdue(), fetchAnalytics()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Administrator Dashboard</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="font-medium">
            {fullName} <span className="text-sm lowercase text-gray-500">({userRole})</span>
          </div>
        </div>
      </div>

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Equipment Inventory</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" /> Loading...
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-gray-600">No equipment found.</div>
          ) : (
            <div className="space-y-3">
              {equipment.map((e) => (
                <div key={e.equipment_id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{e.name}</div>
                    <div className="text-sm text-gray-500">
                      {e.category_id !== undefined && e.category_id !== null
                        ? `Category ID: ${e.category_id}`
                        : 'Category: General'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {e.available_quantity}/{e.total_quantity}
                    </div>
                    <div className="text-sm text-gray-500">Available / Total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Usage & Overdue</h2>

          <div className="mb-4">
            <h3 className="font-medium">Top requested items</h3>
            {topRequested.length === 0 ? (
              <div className="text-sm text-gray-500">No data available.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {topRequested.map((t, idx) => (
                  <li key={t.equipment_name ?? idx} className="flex justify-between text-sm">
                    <span>{t.equipment_name ?? `Equipment #${t.equipment_id ?? 'N/A'}`}</span>
                    <span className="font-semibold">{t.total_units_borrowed ?? 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Overdue loans
            </h3>

            {overdue.length === 0 ? (
              <div className="text-sm text-gray-500 mt-2">No overdue loans.</div>
            ) : (
              <div className="mt-2 space-y-2">
                {overdue.map((o, idx) => (
                  <div key={o.request_id ?? idx} className="p-2 border rounded flex justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{o.equipment_name ?? `Equipment #${o.request_id ?? 'N/A'}`}</div>
                      <div className="text-xs text-gray-500">
                        Borrower: {o.borrower_name ?? o.requester_email ?? 'Unknown'} • Due: {o.expected_return_date ?? 'N/A'}
                      </div>
                    </div>
                    <div className="text-sm text-red-600 font-semibold">Overdue</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => {
            setLoading(true);
            Promise.all([fetchEquipment(), fetchOverdue(), fetchAnalytics()]).finally(() => setLoading(false));
          }}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Refresh
        </button>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">
          Logout
        </button>
      </div>
    </div>
  );
}
