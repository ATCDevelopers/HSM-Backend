import type { ConsultationRow } from "./types";

interface ConsultationDetailModalProps {
  consultation: ConsultationRow;
  onClose: () => void;
}

export default function ConsultationDetailModal({
  consultation,
  onClose,
}: ConsultationDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Consultation details
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              {consultation.date} · {consultation.doctor_name} ·{" "}
              {consultation.visit_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-gray-500 hover:bg-blue-100"
          >
            ✕
          </button>
        </div>

        <hr className="my-4 border-gray-100" />

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400">Chief Complaint</p>
            <p className="mt-0.5 text-gray-900">
              {consultation.chief_complaint}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Patient History</p>
            <p className="mt-0.5 text-gray-900">
              {consultation.history_of_present_illness ||
                "No previous history recorded."}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">
              Physical Examination
            </p>
            <p className="mt-0.5 text-gray-900">
              {consultation.physical_examination}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">
              Preliminary Diagnosis
            </p>
            <p className="mt-0.5 text-gray-900">{consultation.diagnosis}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">
              Assessment & Investigation
            </p>
            <p className="mt-0.5 text-gray-900">
              {consultation.investigation_requirement}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          close
        </button>
      </div>
    </div>
  );
}
