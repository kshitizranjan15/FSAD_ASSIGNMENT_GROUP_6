import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/apiClient';
import { Equipment } from '../types/models';
import { Loader2 } from 'lucide-react';
import Notification from '../components/Notification';

export default function AdminDashboard() {
  const { token, fullName, logout, userRole } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
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

  useEffect(() => {
    setLoading(true);
    fetchEquipment().finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
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

      <section>
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
      </section>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => {
            setLoading(true);
            fetchEquipment().finally(() => setLoading(false));
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
