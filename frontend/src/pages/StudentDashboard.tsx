import React from "react";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { fullName, logout } = useAuth();
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Welcome, {fullName}</h2>
      <p>This is the <strong>Student Dashboard</strong>. You can view and request equipment.</p>
      <button onClick={logout} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
