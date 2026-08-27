import React from 'react';

export const DoctorSchedulePage: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Schedule</h1>
        <input type="date" className="p-2 border rounded-md text-sm" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="p-3 font-medium">09:00 AM</td>
              <td className="p-3">Jane Doe</td>
              <td className="p-3">Routine Checkup</td>
              <td className="p-3"><span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Confirmed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};