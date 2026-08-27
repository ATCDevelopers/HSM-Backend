import React from 'react';

export const PatientHistoryPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Patient Appointment History</h1>
      
      <div className="space-y-3">
        <div className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-800">Dr. Sarah Smith — General Consultation</p>
            <p className="text-sm text-gray-500">March 12, 2026 • 10:30 AM</p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">Completed</span>
        </div>
      </div>
    </div>
  );
};