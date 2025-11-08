// src/pages/StaffDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../api/apiClient';
import { LendingRequest, Equipment } from '../types/models';
import { Loader2, Check, X, Archive } from 'lucide-react';
import Notification from '../components/Notification';

export default function StaffDashboard() {
  const { token, fullName, logout, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<LendingRequest[]>([]);
  const [equipmentMap, setEquipmentMap] = useState<Record<number, Equipment>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeRejectId, setActiveRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // fetch pending/active lending requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Try an explicit "requests" endpoint first
      let data = null;
      try {
        data = await apiCall<LendingRequest[]>('/lending/requests?status=Pending', 'GET', undefined, token);
      } catch (err) {
        // fallback: fetch all lending requests
        data = await apiCall<LendingRequest[]>('/lending', 'GET', undefined, token);
      }
      const filtered = (data || []).filter((r) => r.status === 'Pending' || r.status === 'Approved' || r.status === 'Issued');
      setRequests(filtered);
    } catch (err: any) {
      console.error(err);
      setNotification({ message: 'Could not load requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // fetch equipment list for quick lookup
  const fetchEquipment = async () => {
    try {
      const equipment = await apiCall<Equipment[]>('/equipment', 'GET', undefined, token);
      const map: Record<number, Equipment> = {};
      equipment.forEach((e) => (map[e.equipment_id] = e));
      setEquipmentMap(map);
    } catch (err) {
      console.warn('Equipment fetch failed', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveRequest = async (requestId: number) => {
    setLoading(true);
    try {
      await apiCall(`/lending/approve/${requestId}`, 'POST', undefined, token);
      setNotification({ message: `Request #${requestId} approved`, type: 'success' });
      await fetchRequests();
      await fetchEquipment();
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Approve failed: ${err?.payload?.detail || err?.message || 'server error'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (requestId: number) => {
    setActiveRejectId(requestId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!activeRejectId) return;
    setSubmittingReject(true);
    try {
      await apiCall(`/lending/reject/${activeRejectId}`, 'POST', { reason: rejectReason }, token);
      setNotification({ message: `Request #${activeRejectId} rejected`, type: 'success' });
      setShowRejectModal(false);
      setActiveRejectId(null);
      await fetchRequests();
    } catch (err: any) {
      console.error('reject error', err);
      setNotification({ message: `Reject failed: ${err?.payload?.detail || err?.message || 'server error'}`, type: 'error' });
    } finally {
      setSubmittingReject(false);
    }
  };

  const rejectRequest = (requestId: number) => {
    // open modal for entering reason
    openRejectModal(requestId);
  };

  const markReturned = async (requestId: number) => {
    setLoading(true);
    try {
      await apiCall(`/lending/return/${requestId}`, 'POST', undefined, token);
      setNotification({ message: `Request #${requestId} marked returned`, type: 'success' });
      await fetchRequests();
      await fetchEquipment();
    } catch (err: any) {
      console.error(err);
      setNotification({ message: `Return failed: ${err?.payload?.detail || err?.message || 'server error'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold">Staff Portal</h1>
        <div className="text-right">
          <div className="text-sm text-gray-600">Signed in as</div>
          <div className="font-medium">{fullName} <span className="text-sm lowercase text-gray-500">({userRole})</span></div>
        </div>
      </div>

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <section className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Pending / Active Requests</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" /> Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-gray-600">No requests to show right now.</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((r) => {
              const equip = equipmentMap[r.equipment_id];
              return (
                <div key={r.request_id} className="p-4 border rounded-lg flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      {equip ? equip.name : `Equipment #${r.equipment_id}`}
                      <span className="ml-2 text-sm text-gray-500">x{r.quantity}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Requested by: <span className="capitalize">{(r as any).requester_name || 'Unknown'}</span> • Requested on: {r.request_date}
                    </div>
                    <div className="text-sm text-gray-600">Status: <span className="font-medium">{r.status}</span></div>
                    {/* Show reject reason when present */}
                    {(r as any).reject_reason && (
                      <div className="mt-2 text-sm text-red-600">
                        Rejection reason: {(r as any).reject_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {r.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => approveRequest(r.request_id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => rejectRequest(r.request_id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}

                    {r.status === 'Approved' || r.status === 'Issued' ? (
                      <button
                        onClick={() => markReturned(r.request_id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Archive className="h-4 w-4" /> Mark Returned
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-6 flex justify-between">
        <button onClick={fetchRequests} className="px-4 py-2 bg-gray-200 rounded">Refresh</button>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 z-10 shadow-xl">
            <h3 className="text-xl font-semibold">Reject Request #{activeRejectId}</h3>
            <p className="text-sm text-gray-600 mt-2">Please provide a reason for rejecting this request (optional but recommended).</p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full mt-4 p-3 border rounded-md min-h-[120px] text-sm"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setActiveRejectId(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-md border"
                disabled={submittingReject}
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                disabled={submittingReject}
              >
                {submittingReject ? 'Rejecting...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
