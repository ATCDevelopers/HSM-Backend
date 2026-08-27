import React, { useState } from 'react';

export const NewBookingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    doctorId: '',
    date: '',
    timeSlot: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting Booking:', formData);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">New Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Name</label>
          <input
            type="text"
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Slot</label>
            <input
              type="time"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              value={formData.timeSlot}
              onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
          <textarea
            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
        >
          Confirm Booking
        </button>
      </form>
    </div>
  );
};