import React from 'react';
import { AlertTriangle, CheckCheck } from 'lucide-react';

interface NotificationProps {
  message: string | null;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-100' : 'bg-green-100';
  const textColor = isError ? 'text-red-700' : 'text-green-700';
  const Icon = isError ? AlertTriangle : CheckCheck;

  return (
    <div className={`p-4 mb-4 text-sm ${textColor} ${bgColor} rounded-lg flex items-center justify-between shadow-md`} role="alert">
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" />
        <span className="font-medium">{isError ? 'Error:' : 'Success:'}</span> {message}
      </div>
      <button onClick={onClose} className={`ml-4 font-bold ${isError ? 'text-red-900' : 'text-green-900'}`}>
        &times;
      </button>
    </div>
  );
};

export default Notification;
