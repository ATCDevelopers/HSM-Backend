import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BaseLayout from "../../components/layouts/BaseLayout";
import type { PatientListRow } from "./types";

// TODO: replace with real apiClient.get('/emr/patients?search=...&page=...')
async function mockFetchPatientList(
  search: string,
): Promise<{ rows: PatientListRow[]; total: number }> {
  await new Promise((res) => setTimeout(res, 300));
  const all: PatientListRow[] = [
    {
      patient_id: "PT-00125",
      patient_name: "Jane Adams",
      visit_id: "VIS-00231",
      diagnosis: "Malaria",
      bp: "120/80",
      lab_test_count: 1,
      prescription_count: 2,
    },
    {
      patient_id: "PT-00124",
      patient_name: "John Doe",
      visit_id: "VIS-00230",
      diagnosis: "Hypertension",
      bp: "118/78",
      lab_test_count: 2,
      prescription_count: 3,
    },
    {
      patient_id: "PT-00123",
      patient_name: "Peter John",
      visit_id: "VIS-00229",
      diagnosis: "Pending",
      bp: "125/82",
      lab_test_count: 3,
      prescription_count: 0,
    },
    {
      patient_id: "PT-00122",
      patient_name: "Amina Said",
      visit_id: "VIS-00228",
      diagnosis: "Migraine",
      bp: "119/79",
      lab_test_count: 1,
      prescription_count: 0,
    },
    {
      patient_id: "PT-00121",
      patient_name: "David Paul",
      visit_id: "VIS-00227",
      diagnosis: "Diabetes",
      bp: "130/85",
      lab_test_count: 2,
      prescription_count: 2,
    },
  ];
  const filtered = search
    ? all.filter(
        (p) =>
          p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
          p.patient_id.toLowerCase().includes(search.toLowerCase()),
      )
    : all;
  return { rows: filtered, total: 1002 };
}

const DIAGNOSIS_BADGE: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-600",
};
const DEFAULT_BADGE = "bg-blue-100 text-blue-800";

export default function MedicalRecordsIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<PatientListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    mockFetchPatientList(search).then(({ rows, total }) => {
      setRows(rows);
      setTotal(total);
      setLoading(false);
    });
  }, [search]);

  return (
    <BaseLayout resourceName="Medical Records">
      <div className="rounded-2xl bg-blue-50 p-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-lg font-bold text-gray-900">Medical Records</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Search and select a patient to view their complete EMR.
          </p>

          <div className="relative mt-4">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Patient Name, ID......."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Patients
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Visits
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Diagnosis
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Vitals
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Lab Tests
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Prx
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-400"
                    >
                      Loading patients...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-400"
                    >
                      No patients match your search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.patient_id}
                      onClick={() =>
                        navigate(`/medical-records/${row.patient_id}`)
                      }
                      className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {row.patient_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {row.patient_id}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.visit_id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            DIAGNOSIS_BADGE[row.diagnosis] ?? DEFAULT_BADGE
                          }`}
                        >
                          {row.diagnosis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.bp}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.lab_test_count} Test
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.prescription_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-blue-600">
                          View
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {rows.length} of {total} patients
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-md text-xs font-semibold ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
