# Backend: features added (Nov 2026)

What was added to or changed in the backend, in the order it was built. Each entry gives what the feature does, how it works, and where the code lives. For the full endpoint reference and rules, see [README.md](README.md). The matching screens are in [HSM-Frontend/FEATURES.md](../HSM-Frontend/FEATURES.md).

**Teammates: run `npx drizzle-kit push` and `npm run seed:statuses`** after pulling. The database changes are listed at the end ([§15](#15-database-changes-summary)).

---

## Contents

1. [Security and build fixes](#1-security-and-build-fixes)
2. [Statuses module and seed](#2-statuses-module-and-seed)
3. [Connecting the unreachable and unprotected routes](#3-connecting-the-unreachable-and-unprotected-routes)
4. [New endpoints the frontend needed](#4-new-endpoints-the-frontend-needed)
5. [Role permission fixes](#5-role-permission-fixes)
6. [Lab results sent to doctors](#6-lab-results-sent-to-doctors)
7. [Lab history with technician and doctor](#7-lab-history-with-technician-and-doctor)
8. [Pharmacy queue and safe dispensing](#8-pharmacy-queue-and-safe-dispensing)
9. [Automatic billing](#9-automatic-billing)
10. [Patient balance for reception](#10-patient-balance-for-reception)
11. [Documents from other hospitals](#11-documents-from-other-hospitals)
12. [Departments: membership, transfers, availability](#12-departments-membership-transfers-availability)
13. [Heads of department](#13-heads-of-department)
14. [Sample data and test accounts](#14-sample-data-and-test-accounts)
15. [Database changes (summary)](#15-database-changes-summary)

---

## 1. Security and build fixes

| Problem found | Fix | Where |
| --- | --- | --- |
| **Anyone could sign up as Admin.** Public `POST /auth/register` trusted the `role` in the request. | `/auth/register` now requires an Admin login (`authenticateToken, adminOnly`). Staff are created through the admin-only `/auth/register-worker`. | `routes/user.route.ts` |
| **The backend didn't compile.** `labTest.service.ts` imported a repository that doesn't exist. | The unfinished file is excluded from the build in `src/tsconfig.json` (kept, not deleted). | `src/tsconfig.json` |
| No security headers, no brute-force protection | `helmet()` on every response; `express-rate-limit` on `/auth/login` (10 attempts / 15 min / IP, then 429). Limited to login so staff sharing one hospital IP aren't blocked from normal use. | `app.ts` |
| An expired token returned **403**, so the frontend never refreshed it | Invalid/expired tokens return **401** | `middleware/auth.middleware.ts` |
| `GET /users/:id` registered twice | Duplicate removed | `routes/user.route.ts` |
| `dist/` not gitignored | Added `/dist` | `.gitignore` |
| Misspelt files (`perscription.*`, `perscription.respository.ts`) and misspelt prescription URLs | Renamed to `prescription.*`; URLs are now `/prescriptions/...` | `routes`, `controllers`, `services`, `repositories` |
| Empty `src/requests/new.ts` | Deleted | |

## 2. Statuses module and seed

**Why:** medicines, prescriptions and invoices all require a `status_id`, but the statuses table was empty and had no endpoint, so none of them could be created.

**How it works:**

- `GET /statuses?groupType=medicine|prescription|invoice`, readable by any signed-in user.
- `npm run seed:statuses` inserts the defaults and skips any that exist (`ON CONFLICT DO NOTHING`):
  - **medicine:** `in_stock`, `low_stock`, `out_of_stock`, `discontinued`
  - **prescription:** `pending`, `dispensed`, `cancelled`
  - **invoice:** `unpaid`, `partially_paid`, `paid`, `void`

**Files:** `routes/status.route.ts`, `controllers/status.controller.ts`, `services/status.service.ts` (`DEFAULT_STATUSES`), `repositories/status.repository.ts`, `drizzle/seed-statuses.ts`, `package.json` script.

## 3. Connecting the unreachable and unprotected routes

| Change | Detail |
| --- | --- |
| **Mounted** invoice, invoice-item and prescription routers | They existed but weren't in `app.ts`. Now `/api/v1/invoices`, `/api/v1/invoice-items`, `/api/v1/prescriptions`, each behind `authenticateToken` + `checkAbility(…, "Billing" \| "Prescription")`. |
| **Invoices linked to patients** | `invoice.patient_id` pointed at the **user** table, so an invoice for a real patient could never be saved. It now references `patients`, and the invoice list/detail joins patient names. |
| `invoice_items` duplicate mapping | `type` and `description` both mapped to the `description` column; `type` removed. |
| **Vitals routes unreachable** | `GET /patient/:patientId` was captured by the patient router, and `DELETE /:id` was a catch-all. Moved to `/vitals/patient/:id`, `/vitals/patient/:id/audit`, `DELETE /vitals/:id`. |
| **Patient routes had no permission checks** | Any logged-in user could delete patients. Every patient route now has `checkAbility`; the PDF and document routes moved from a bare `/:id/...` to `/patients/:id/...`. |
| Medicine, lab-test, lab-result and prescription-item routes | Added `checkAbility` everywhere. The lab routes had their auth middleware commented out and only worked because another router happened to run first. |
| **JSON error handler** | Controllers calling `next(error)` used to send an HTML page. A final handler in `app.ts` now returns `{ success: false, error }` using `err.status`. |
| Middleware typing | `checkAbility`, `adminOnly` and `departmentAccess` are typed `RequestHandler<any>`, so they work alongside handlers typed `Request<{ id: string }>`. |

## 4. New endpoints the frontend needed

| Endpoint | Why | How |
| --- | --- | --- |
| `GET /appointments/:id` | Appointment status page | Reuses the report query with an `appointmentId` filter, so names are joined. Doctors can open only their own. Registered after `/appointments/reports`. |
| `GET /doctors/:doctorId/schedules` | Schedule editor | Returns `{ schedules, leaves }` from the existing repositories |
| `GET /doctors` | Booking and lab screens need a doctor list, but `/users` is admin/manager only | Returns only `id`, names, `departmentId`, `availability`, so it's safe for any signed-in staff member |

## 5. Role permission fixes

Found while connecting screens and seeding data (`config/ability.ts`):

| Role | Added | Reason |
| --- | --- | --- |
| Doctor | read Medicine, read Vitals, update Consultation | Couldn't prescribe (no medicine list), see vitals, or edit consultations |
| Nurse | read/write/**create/update** Vitals, read Consultation, read Laboratory | **Nurses couldn't record vitals at all** (CASL `write` ≠ `create`) |
| Pharmacist | manage Medicine, read/update Prescription, read Prescription-Items | Couldn't see or dispense prescriptions |
| Accountant | read Patient | Invoices need patient names |
| Receptionist | **removed** Billing read; added `PatientBalance` (§10) | Billing is for the billing department only |
| Nurse (appointment report) | Added to the roles that see the full appointment board | Nurses work the patient queue |

## 6. Lab results sent to doctors

**What:** the lab sends each result to a specific doctor, and each doctor has an inbox of results sent to them.

**How:**

- New column `test_results.doctor_id`, a foreign key to `user`. `POST /test-results` accepts `doctorId`.
- `GET /test-results` (new) returns results joined with test, patient and doctor names, newest first.
  - **A doctor always gets only their own results**: the controller forces `doctorId = req.user.id`.
  - Other readers can pass `?doctorId=`.

**Files:** `drizzle/schema.ts` (`testResults.doctorId`, `doctor` relation), `repositories/LabTestResults.repository.ts` (`findAll`), `services/labTestResults.service.ts` (`listResults`), `controllers/labTestResults.controller.ts` (`listTestResults`), `routes/labTestResults.route.ts`.

## 7. Lab history with technician and doctor

`GET /test-results/patient/:id` now includes `technician` and `doctor` (names only) and is ordered newest first. The medical-record lab panel and printed lab reports use it (`findByPatient`).

## 8. Pharmacy queue and safe dispensing

**What:** previously "dispensing" only changed a label, and stock never moved. Now dispensing deducts stock correctly, even under concurrent use.

**Endpoints:**

- `GET /prescriptions?status=pending`: the pharmacy queue, with patient, doctor and status names (`findAll`).
- `POST /prescriptions/:id/dispense` (perm `update Prescription`, so Pharmacist or Admin).

**How dispensing works** (`prescriptionsRepository.dispense`, one transaction):

1. `SELECT … FOR UPDATE` on the prescription; refuse unless its status is `pending` (409 `INVALID_STATE`).
2. Lock every medicine on it (`FOR UPDATE OF medicines`) and add up quantities per medicine (the same medicine can appear on several lines).
3. If any medicine is short, throw `INSUFFICIENT_STOCK: Ciprofloxacin 500mg (need 14, have 8)` (409). Nothing changes.
4. `stock = stock - qty` per medicine; set the status to `dispensed`.
5. Return `{ prescription, dispensed: [{medicine, quantity, remainingStock}] }`. After commit, record pharmacy charges (§9).

**Tested:** two simultaneous dispenses of one prescription returned 200 and 409, and stock was deducted once.

## 9. Automatic billing

**What:** every service a patient receives is charged behind the scenes. Billing staff set prices, see all charges, and turn them into invoices. Clinical roles never see any of it.

### 9.1 Payment type at registration

- New `payment_mode` enum (`NHIF`, `INSURANCE`, `CASH`) on `patients`; `nhif_card` is now **nullable**.
- `registerPatient` requires a card number unless `CASH`.
- Updating a patient stores an empty card as `NULL`, so cash patients don't collide on the unique column.

### 9.2 Price list: `billable_services` (discovered automatically)

`syncCatalog()` runs on every `GET /billing/services` and upserts one service per source. It updates names only, never prices.

| Code | Comes from | Starts |
| --- | --- | --- |
| `REGISTRATION`, `VITALS` | fixed | unpriced |
| `CONSULTATION:<type>` | default appointment types + any used | unpriced |
| `LAB:<testId>` | every lab test | unpriced |
| `MED:<medicineId>` | every medicine | its pharmacy price |
| `CUSTOM:<NAME>` | `POST /billing/services` | as entered |

`PATCH /billing/services/:id {price, isActive, name}`: setting a price also fills unbilled charges that were recorded without one, and the response reports `pricedCharges`.

### 9.3 Charges: `service_charges` (recorded automatically)

Hooks in `services/billing.service.ts`, called after each clinical action succeeds:

| Clinical action (service) | Hook | Charge |
| --- | --- | --- |
| `registerPatient` (cash only) | `chargeRegistration` | REGISTRATION |
| `bookAppointmentService` | `chargeAppointment` | CONSULTATION:<type> |
| `cancelAppointmentService` / status → cancelled | `waiveAppointment` | waives the unbilled consultation charge |
| `recordVitals` | `chargeVitals` | VITALS |
| `createResult` (lab) | `chargeLabResult` | LAB:<test> |
| `dispensePrescription` | `chargeDispense` | MED:<id> × quantity, per medicine |

**How charges behave:**

- **Never block care.** `recordCharge` catches and logs (`[billing] …`); billing can't fail a clinical request.
- **No double charges.** A unique index on `(source_type, source_id, billable_service_id)`; inserts use `ON CONFLICT DO NOTHING`.
- **Price frozen.** `unit_price` and `amount` are copied at charge time, so later price changes don't rewrite history.
- **Payer recorded.** `payer` is copied from the patient: `CASH` is paid at the desk; `NHIF`/`INSURANCE` are claims.
- **Status:** `unbilled` → `invoiced` | `waived`.

### 9.4 Billing endpoints (`routes/billing.route.ts`, mounted at `/api/v1/billing`)

| Endpoint | Perm | What it does |
| --- | --- | --- |
| `GET /charges?status&patientId&category&payer` | read Billing | Charges with patient and service names |
| `POST /charges` | create Billing | Manual charge (e.g. a custom maternity package) |
| `PATCH /charges/:id/waive {waived}` | update Billing | Waive or restore an unbilled charge |
| `POST /charges/invoice {patientId, chargeIds}` | create Billing | One transaction: lock the charges, check same patient / unbilled / priced, create an `unpaid` invoice `INV-YYYYMMDD-NNNN` with one line per charge, mark the charges invoiced |

**Files:** `repositories/billing.repository.ts`, `services/billing.service.ts`, `controllers/billing.controller.ts`, `routes/billing.route.ts`, plus the hooks in the patient, appointment, vital, labTestResults and prescription services.

## 10. Patient balance for reception

**What:** the receptionist can tell a patient what they owe without seeing the rest of billing.

**How:**

- New CASL subject `PatientBalance`, granted to Receptionist, Cashier, Accountant and ClinicManager.
- `GET /billing/balance/:patientId` returns:
  - `amountDue` = unbilled **cash** charges + `unpaid`/`partially_paid` invoices that aren't insurance claims. An invoice counts as a claim if any of its charges has a non-cash payer, checked with an `EXISTS` subquery so item totals aren't multiplied by a join.
  - `notYetInvoiced`, `unpaidInvoices`, `coveredByInsurance`, `unpricedCount`, plus line items.

**Files:** `config/ability.ts`, `billing.repository.ts` (`invoiceTotalsForPatient`), `billing.service.ts` (`patientBalance`), `billing.controller.ts`, `billing.route.ts`.

## 11. Documents from other hospitals

**What:** patients bring referral letters, outside lab reports and scans. Staff upload them, and any department that can view the patient can preview them.

**How:**

- `patient_documents` gained `source_institution`, `document_type`, `document_date`, `notes`; `created_by` records the uploader.
- **Upload:** `POST /patients/:id/documents` (perm update Patient). Multer takes PDF/JPG/PNG up to 10 MB into `uploads/documents/` (gitignored). `documentType` is validated against: `referral_letter`, `lab_report`, `imaging`, `discharge_summary`, `prescription`, `medical_report`, `other`.
- **List:** `GET /patients/:id/documents`, excluding soft-deleted documents, with the uploader's name.
- **Preview (new):** `GET /patients/:id/documents/:documentId/file` streams the file inline. Before sending, it checks that the document belongs to `:id` and that the stored path resolves **inside** the uploads folder. Files are never served statically.
- **Delete (new):** `DELETE /patients/:id/documents/:documentId` is a soft delete; the file is kept for audit.

**Files:** `drizzle/schema.ts`, `repositories/patient.repository.ts` (`DocumentRepository`), `services/patient.service.ts` (`DocumentService`), `controllers/patient.controller.ts` (`streamPatientDocument`, `deletePatientDocument`), `routes/patient.route.ts`.

## 12. Departments: membership, transfers, availability

**What:** every staff member belongs to a department, and managers can see who's in each one, move people, and mark who's available.

**How:**

- New `user.availability` (`available`/`busy`/`on_leave`/`off_duty`, default `available`) and `availability_updated_at`. Both appear in user queries and the doctor list.
- **Department endpoints:**

| Endpoint | Perm | What it does |
| --- | --- | --- |
| `GET /department/:id/members` | manager or head | Active members |
| `GET /department/staff` | read Department | All staff with department name (the "add staff" picker) |
| `PUT /department/:id/members/:userId` | update Department | Add, or **transfer** in (returns `previousDepartmentId`) |
| `DELETE /department/:id/members/:userId` | update Department | Remove (person becomes unassigned) |
| `PATCH /department/staff/:userId/availability` | update Department | Manager sets anyone's availability |
| `GET /department/staff/me` · `PATCH /department/staff/me/availability` | signed in | Your own record / set your own availability |

- **Deleting a department with staff** is refused with 409, instead of failing on the foreign key.
- **Security fix:** `GET/PUT/DELETE /department/:id` and `/tree` had **no permission checks**, so any logged-in user could delete a department. All are now checked.

**Files:** `drizzle/schema.ts`, `repositories/department.repository.ts`, `services/department.service.ts` (`AVAILABILITY`), `controllers/department.controller.ts`, `routes/department.route.ts`, `repositories/user.repository.ts`.

## 13. Heads of department

**What:** an Admin appoints a head for each department. The head manages only their own department: view the team, set availability, edit details. They can't add, transfer or remove staff.

**How:**

- New `department.head_user_id`, a foreign key to `user` (`ON DELETE SET NULL`).
- `PUT /department/:id/head {userId | null}` is **admin only**. The person must already be a member of the department (409 otherwise).
- **New middleware `departmentAccess(action)`** (`middleware/department.middleware.ts`): lets a request through if the user can do `action` on any Department, **or** is the head of the department in `:id`. It sets `req.departmentAccess = "manager" | "head"`. Applied to:
  - `GET /department/:id`
  - `PUT /department/:id` (heads: name, code, location only; `parentDepartmentId` and `headUserId` are ignored)
  - `GET /department/:id/members`
  - `PATCH /department/:id/members/:userId/availability` (new; the person must belong to that department)
- **Transferring or removing a head** clears the head automatically (`clearHeadIf`).
- `GET /department/staff/me` now includes `headOf: [{id, name, code}]`, which the frontend uses for the "My Department" entrance.

## 14. Sample data and test accounts

These were created in the local `hms_db_2` database through the API, as the role that would really do each action:

- **Accounts:** nine role accounts `*@hms.test` (password `Abc@2026.`) and `user@gmail.com` (Admin).
- **Departments:** ADM, MED, LAB, ACC, PHA, with every staff account assigned and sample heads.
- **Patients:** 20 with `NHIF-TEST-0001…0020`, plus the cash patient Salome Mrema.
- **Catalogue:** 15 lab tests with normal ranges, and 12 medicines (Ciprofloxacin deliberately low on stock).
- **Clinical records:** vitals, consultations, lab results and prescriptions for 8 patients; two prescriptions dispensed.
- **Billing:** sample prices in TZS, and one invoice for Salome Mrema.

## 15. Database changes (summary)

All of these are in `src/drizzle/schema.ts`. Run `npx drizzle-kit push` to apply them to another database.

| Table | Change |
| --- | --- |
| `invoice` | `patient_id` foreign key now references `patients(patient_id)` instead of `user(id)` |
| `invoice_items` | removed the duplicate `type` mapping (no DB column change) |
| `patients` | `+ payment_mode` enum (`NHIF` default); `nhif_card` now nullable |
| `test_results` | `+ doctor_id` → `user` |
| `patient_documents` | `+ source_institution`, `document_type`, `document_date`, `notes` |
| `user` | `+ availability` (default `available`), `availability_updated_at` |
| `department` | `+ head_user_id` → `user` (`ON DELETE SET NULL`) |
| **new** `billable_services` | price list (`code` unique, `category`, `department`, `price` nullable, `is_active`) |
| **new** `service_charges` | charges, unique `(source_type, source_id, billable_service_id)` |
| new enum `payment_mode` | `NHIF`, `INSURANCE`, `CASH` |
| `statuses` (data) | seeded by `npm run seed:statuses` |
