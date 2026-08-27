import React from 'react';

export const AppointmentStatusPage: React.FC = () => {
  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-4 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Appointment Status</h2>
      <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
        <p className="text-sm font-medium">Status: In Progress</p>
        <p className="text-xs mt-1">Estimated Wait Time: ~15 mins</p>
      </div>
      <div className="text-left text-sm text-gray-600 space-y-1">
        <p><strong>Appointment ID:</strong> #APT-8849</p>
        <p><strong>Doctor:</strong> Dr. Sarah Smith</p>
        <p><strong>Scheduled Time:</strong> 11:30 AM</p>
      </div>
    </div>
  );
};