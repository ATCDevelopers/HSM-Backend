import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  PatientHeader,
  ConsultationRow,
  VitalsRow,
  LabTestRow,
  PrescriptionRow,
  DiagnosisRow,
} from "./types";

const BRAND_COLOR: [number, number, number] = [23, 58, 94]; // matches sidebar navy #173A5E
const ACCENT_COLOR: [number, number, number] = [37, 99, 235]; // blue-600

interface ExportPatientPdfArgs {
  header: PatientHeader;
  consultations: ConsultationRow[];
  vitals: VitalsRow[];
  labTests: LabTestRow[];
  prescriptions: PrescriptionRow[];
  diagnoses: DiagnosisRow[];
}

export function exportPatientRecordPdf({
  header,
  consultations,
  vitals,
  labTests,
  prescriptions,
  diagnoses,
}: ExportPatientPdfArgs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  // ---- Branded header band ----
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("HMS — Hospital Management System", marginX, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Patient Medical Record", marginX, 48);

  const generatedOn = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.text(`Generated: ${generatedOn}`, pageWidth - marginX, 48, { align: "right" });

  // ---- Patient info card ----
  let y = 95;
  doc.setFillColor(240, 246, 255);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 55, 6, 6, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(header.name, marginX + 16, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `${header.patient_id}  ·  ${header.gender}  ·  ${header.age} years  ·  ${header.phone}`,
    marginX + 16,
    y + 42
  );

  y += 80;

  const sectionTitle = (title: string) => {
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, marginX, y);
    y += 8;
  };

  const tableOptions = {
    startY: y,
    margin: { left: marginX, right: marginX },
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255, fontStyle: "bold" as const },
    styles: { fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  };

  // ---- Consultations ----
  sectionTitle("Consultations");
  autoTable(doc, {
    ...tableOptions,
    head: [["Date", "Doctor", "Chief Complaint", "Diagnosis"]],
    body: consultations.map((c) => [c.date, c.doctor_name, c.chief_complaint, c.diagnosis]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Vitals ----
  sectionTitle("Vitals");
  autoTable(doc, {
    ...tableOptions,
    startY: y,
    head: [["Date", "BP", "Temp", "HR", "RR", "SpO2", "Weight"]],
    body: vitals.map((v) => [v.date, v.bp, v.temp, v.hr, v.rr, v.spo2, v.weight]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Lab tests ----
  sectionTitle("Lab Tests");
  autoTable(doc, {
    ...tableOptions,
    startY: y,
    head: [["Date", "Test", "Status", "Result"]],
    body: labTests.map((l) => [l.date, l.test, l.status, l.result]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Prescriptions ----
  sectionTitle("Prescriptions");
  autoTable(doc, {
    ...tableOptions,
    startY: y,
    head: [["Date", "Medication", "Dose", "Frequency", "Status"]],
    body: prescriptions.map((p) => [p.date, p.medication, p.dose, p.frequency, p.status]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // ---- Diagnoses ----
  sectionTitle("Diagnoses");
  autoTable(doc, {
    ...tableOptions,
    startY: y,
    head: [["Date", "Diagnosis", "ICD-10", "Status"]],
    body: diagnoses.map((d) => [d.date, d.diagnosis, d.icd10, d.status]),
  });

  // ---- Footer on every page: confidentiality notice + page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Confidential — For authorized clinical use only.",
      marginX,
      pageHeight - 25
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 25, {
      align: "right",
    });
  }

  doc.save(`${header.name.replace(/\s+/g, "_")}_${header.patient_id}_EMR.pdf`);
}