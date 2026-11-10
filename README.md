# HMS Backend: Hospital Management System API

REST API for a hospital: patient registration, appointments, clinical records (vitals, consultations, lab results, prescriptions), pharmacy dispensing, automatic billing, departments and staff. It serves the React app in `../HSM-Frontend`.

**Stack:** Node.js · Express 5 · TypeScript (ESM) · PostgreSQL · Drizzle ORM · JWT (access + refresh) · CASL (permissions) · Helmet · express-rate-limit · Multer (uploads) · PDFKit · node-cron

---

## Contents

1. [Getting started](#1-getting-started)
2. [Project structure and how a request flows](#2-project-structure-and-how-a-request-flows)
3. [Authentication](#3-authentication)
4. [Authorization (who can do what)](#4-authorization-who-can-do-what)
5. [Errors and response shapes](#5-errors-and-response-shapes)
6. [Data model](#6-data-model)
7. [Modules, one by one](#7-modules-one-by-one)
8. [A patient's journey through the system](#8-a-patients-journey-through-the-system)
9. [Changing the database](#9-changing-the-database)
10. [Adding a new module](#10-adding-a-new-module)
11. [Testing and test accounts](#11-testing-and-test-accounts)
12. [Known limitations](#12-known-limitations)

---

## 1. Getting started

### Requirements

- Node.js 20+
- PostgreSQL 14+

### Environment (`.env`, copy from `.env.example`)

| Variable | Purpose |
| --- | --- |
| `PORT` | Port the API listens on (the team uses `8000`; the frontend's `VITE_API_URL` must match) |
| `CLIENT_URL` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `DATABASE_URL` | Postgres connection string used by the app |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Same database, used by `drizzle-kit` |
| `JWT_SECRET` | Signs access tokens. **The app refuses to start without it.** |
| `JWT_REFRESH_TOKEN` | Signs refresh tokens. **Required.** |

### Commands

```bash
npm install
npm run dev              # nodemon + tsx, reloads on change
npm run build            # tsc -> dist/
npm start                # node dist/app.js
npm run seed:statuses    # inserts the default statuses (safe to run repeatedly)
npx drizzle-kit push     # syncs src/drizzle/schema.ts to the database
```

**First run on a fresh database:**

1. Run `npx drizzle-kit push`.
2. Run `npm run seed:statuses`. Medicines, prescriptions and invoices can't be created until this has run.
3. Create the first Admin directly in the database (see §11). Every other staff account is created by an Admin.

---

## 2. Project structure and how a request flows

```text
src/
├── app.ts                  # Express setup, middleware, router mounting, error handler, cron start
├── config/
│   ├── auth.config.ts      # JWT sign/verify (access 12h, refresh 7d)
│   ├── ability.ts          # CASL rules per role  ← single source of truth for permissions
│   └── db.ts               # Drizzle + postgres client
├── middleware/
│   ├── auth.middleware.ts           # authenticateToken: verifies JWT, attaches req.user + req.ability
│   ├── authorization.middleware.ts  # checkAbility(action, subject), adminOnly
│   ├── department.middleware.ts     # departmentAccess: managers OR head of that department
│   └── appointment.middleware.ts    # request validation for appointment endpoints
├── routes/          # URL + middleware chain only, no logic
├── controllers/     # read req, call a service, shape the HTTP response
├── services/        # business rules, validation, cross-module hooks (e.g. billing)
├── repositories/    # Drizzle queries and transactions only
└── drizzle/
    ├── schema.ts            # every table, enum and relation
    └── seed-statuses.ts     # npm run seed:statuses
```

**Every request takes the same path:**

```text
HTTP request
  → helmet, morgan, json body (50 MB), cookie-parser, CORS(CLIENT_URL)
  → [/api/v1/auth/login only] rate limiter: 10 attempts / 15 min / IP
  → router (mounted under /api/v1)
      → authenticateToken        401 if no/invalid/expired token
      → checkAbility(...)         403 if the role may not do this
      → [optional] validation middleware (appointments)
      → controller → service → repository → PostgreSQL
  → JSON response
  → (errors passed to next(err)) → JSON error handler in app.ts
```

**Mount order matters.** Several routers run `router.use(authenticateToken)` and are mounted at `/api/v1`, so the login check also applies to every router mounted after them. Login and token refresh are mounted first and stay public. For the same reason, an unknown URL returns 401 rather than 404.

**Route order matters too.** Fixed paths such as `/appointments/reports` and `/department/staff` are registered before `/:id`, so that `reports` or `staff` is never read as an id.

---

## 3. Authentication

| Step | Endpoint | What happens |
| --- | --- | --- |
| Log in | `POST /auth/login` `{email, password}` | Rejects deleted/inactive accounts, checks the bcrypt password, issues an **access token** (12 h) and a **refresh token** (7 d). The refresh token is stored in the `tokens` table and set as an `httpOnly` cookie. Returns `{ user, accessToken, refreshToken }`. |
| Call the API | any | Send `Authorization: Bearer <accessToken>`. The token holds `{ id, email, role }`. |
| Refresh | `POST /auth/refresh` (alias `/auth/refresh-token`) | Reads the refresh token from the cookie, the body or `x-refresh-token`, then **rotates** it: the old one is revoked and a new pair is issued. **Reuse detection:** a validly signed refresh token that is no longer in the database (already used or revoked) revokes *all* of that user's refresh tokens. |
| Log out | `POST /auth/logout` | Deletes all of the user's refresh tokens and clears the cookie. |

- **Expired or invalid access tokens return 401**, never 403. The frontend's automatic refresh relies on that.
- **Token cleanup:** a node-cron job (`initTokenCleanupCron`) deletes expired refresh tokens every day at midnight.
- **Brute-force protection:** `/auth/login` allows 10 attempts per IP per 15 minutes, then returns 429. Restarting the server resets the limit.
- **Staff accounts are created only by Admins:**
  - `POST /auth/register-worker` validates the role.
  - `POST /auth/register` is also admin-only now.
  - There is no public sign-up, because every role in the schema is a staff role. Patients are records, not logins.

---

## 4. Authorization (who can do what)

Permissions are defined once, in `src/config/ability.ts`, using CASL. `authenticateToken` builds `req.ability` from the token's role, and routes check it with `checkAbility(action, subject)`.

**Important:** in CASL, `write` is a different action from `create` and `update`. A rule must grant the exact action the route checks. This was the cause of a real bug: nurses couldn't record vitals.

### Role summary

| Role | Main rights |
| --- | --- |
| **Admin** | `manage all`; also the only role that can register staff and appoint heads of department |
| **ClinicManager** | Read users and clinical data · manage Departments, Appointments, Reports, Insurance, Inventory · read Billing · read PatientBalance |
| **Doctor** | Manage Patients and Appointments · read/write/update Consultations · read/write Prescriptions · read Medicines, Vitals, Lab results · own reports only |
| **Nurse** | Read/update Patients · read Appointments · create/update Vitals · read Consultations, Lab results, Prescriptions |
| **Receptionist** | Manage Patients and Appointments · read **PatientBalance** (what a patient owes, nothing else in billing) |
| **Pharmacist** | Read Patients · manage Medicines, Pharmacy, Inventory · read/update Prescriptions (dispensing) |
| **LabTechnician** | Read Patients · manage Lab tests (templates) and Laboratory (results) |
| **Cashier** | Read Patients · manage Billing, Insurance · read PatientBalance |
| **Accountant** | Read Patients · manage Billing, Insurance, Inventory · read PatientBalance |

### Rules that aren't just "role → permission"

- **Appointment reports.** `/appointments/reports` is opened by `read Report`, and the controller then narrows it:
  - Admin, ClinicManager, Receptionist and Nurse see everything.
  - A Doctor is forced to their own appointments.
  - Everyone else gets 403.
- **Head of department.** This is per person, not a role (`department.head_user_id`). `departmentAccess(action)` lets a request through if the user can do `action` on any Department, **or** is the head of the department in `:id`, and sets `req.departmentAccess = "manager" | "head"`. Heads can view their own department and team, set their team's availability, and edit name, code and location. They can't add, transfer or remove staff.
- **Own availability.** Any signed-in staff member can read and set their own availability (`/department/staff/me`).
- **Doctor directory.** `GET /doctors` returns only ids, names, department and availability, and any signed-in staff member can read it. Booking and the lab's "send result to doctor" need it.

---

## 5. Errors and response shapes

- **Success responses** are mostly `{ success: true, data, message? }`. Some older modules (medicine, department, invoices) return the bare record or array. The frontend's `extractList`/`extractRecord` helpers handle both.
- **Error responses** look like `{ error: "message" }` (some older modules use `{ success: false, message }`).
- **Service error codes.** Services throw `new Error("CODE: human message")`, and controllers map the code to a status and strip it from the message:

| Code | Status | Example |
| --- | --- | --- |
| `NOT_FOUND` | 404 | appointment / charge / document not found |
| `INVALID`, `INVALID_DATE`, `REASON_REQUIRED` | 400 | bad input |
| `INVALID_STATE`, `INVALID_TRANSITION`, `SLOT_BOOKED`, `INSUFFICIENT_STOCK`, `UNPRICED` | 409 | conflicts with the current state |
| `CONFIG` | 500 | e.g. statuses not seeded |

- **Errors passed to `next(error)`** reach the JSON error handler at the end of `app.ts`, which uses `err.status` (default 400). Services can throw `Object.assign(new Error(msg), { status: 409 })`.

---

## 6. Data model

All tables live in `src/drizzle/schema.ts`. Most share `auditLogs` columns: `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `created_by`, `updated_by`, `deleted_by`. Soft delete is preferred (see `SoftDeleteMechanism.md`).

| Area | Tables | Key points |
| --- | --- | --- |
| Staff | `user`, `tokens`, `department` | `user.role` enum (9 staff roles) · `user.department_id` · `user.availability` (`available`/`busy`/`on_leave`/`off_duty`) + `availability_updated_at` · `department.head_user_id` · `department.parent_department_id` (sub-departments) |
| Patients | `patients`, `address`, `patient_documents` | `payment_mode` enum `NHIF`/`INSURANCE`/`CASH` · `nhif_card` unique and **nullable** (cash patients have none) · documents keep `source_institution`, `document_type`, `document_date`, `notes` |
| Appointments | `appointments`, `doctor_schedules`, `doctor_leaves`, `appointment_audit_logs` | status enum `scheduled → confirmed → checked_in → completed` (+ `cancelled`, `no_show`); every change is audit-logged |
| Clinical | `vitals`, `consultation`, `lab_tests`, `test_results` | `lab_tests.form_schema` (jsonb) defines each test's fields; `test_results.values` (jsonb) stores the answers; `test_results.doctor_id` is the doctor the result was sent to |
| Pharmacy | `medicines`, `prescriptions`, `prescription_items` | `medicines.stock` · prescription `status_id` → statuses (`pending`/`dispensed`/`cancelled`) |
| Billing | `billable_services`, `service_charges`, `invoice`, `invoice_items`, `statuses` | see §7.9 · `invoice.patient_id` → `patients` |
| Lookups | `statuses` | `name` (unique) + `group_type` (`medicine`, `prescription`, `invoice`); seeded by `npm run seed:statuses` |

Tables that exist **without endpoints yet**: `payments`, `payment_types`, `payment_method`, `insurance_companies`, `patient_insurances`, `wards`, `beds`, `rooms`, `kin_details`, `patient_contacts`, `diagnosis*`.

---

## 7. Modules, one by one

All paths are under `/api/v1`. "Perm" is the `checkAbility` requirement.

### 7.1 Staff accounts: `routes/user.route.ts`

| Method & path | Perm | Notes |
| --- | --- | --- |
| `POST /auth/register-worker` | Admin only | Creates a staff account (validated role, optional `departmentId`) |
| `POST /auth/register` | Admin only | Same, older endpoint |
| `GET /users` · `GET /users/:id` | read User | Passwords are never returned |
| `PUT/PATCH /users/:id` | update User | Partial update; `status: INACTIVE` deactivates (blocks login) |
| `DELETE /users/:id` | delete User | Soft delete |
| `GET /doctors` | signed in | Doctor directory (id, name, department, availability) |

### 7.2 Departments, staff and heads: `routes/department.route.ts`

| Method & path | Perm | What it does |
| --- | --- | --- |
| `GET/POST /department` | read / write Department | List / create (`name`, `code`, `location`, `parentDepartmentId`) |
| `GET /department/:id` | manager **or head** | One department |
| `PUT /department/:id` | manager **or head** | Edit. Heads can't change `parentDepartmentId`; `headUserId` is always ignored here |
| `DELETE /department/:id` | delete Department | **Refused (409) while the department still has staff** |
| `GET /department/:id/members` | manager or head | Active staff with role, contacts, availability |
| `PUT /department/:id/members/:userId` | update Department | Add an unassigned person, or **transfer** someone in (returns `previousDepartmentId`) |
| `DELETE /department/:id/members/:userId` | update Department | Remove (person becomes unassigned) |
| `PATCH /department/:id/members/:userId/availability` | manager or head | Set availability of someone **in that department** |
| `PUT /department/:id/head` `{userId \| null}` | **Admin only** | Appoint/clear the head. The person must already be a member (409 otherwise) |
| `GET /department/staff` | read Department | All staff with their department name (for the "add staff" picker) |
| `GET /department/staff/me` | signed in | Your own record, department name and `headOf` list |
| `PATCH /department/staff/me/availability` | signed in | Set your own availability |
| `PATCH /department/staff/:userId/availability` | update Department | Managers set anyone's availability |

If a head is transferred or removed, the department they headed loses its head automatically (`clearHeadIf`).

### 7.3 Patients: `routes/patient.route.ts`

| Method & path | Perm | Notes |
| --- | --- | --- |
| `POST /patient` | create Patient | Body `{ patient: {…, paymentMode}, address: {…} }`. `paymentMode` = `NHIF` (default) / `INSURANCE` / `CASH`. A card number is required unless `CASH`. **A cash registration automatically creates a registration charge** (§7.9). |
| `GET /patients` · `GET /patient/:id` | read Patient | With address and `paymentMode` |
| `PUT /patient/:id` | update Patient | `{ patientData, addressData }`; an empty card is stored as `NULL` (so cash patients don't collide on the unique column) |
| `DELETE /patients/:id` · `POST /patients/:id/recover` | delete / update Patient | Soft delete and restore |
| `GET /patients/:id/pdf` | read Patient | PDF summary (PDFKit) |
| `POST /patients/:id/documents` | update Patient | Multipart: `document` (PDF/JPG/PNG, ≤ 10 MB) + `sourceInstitution`, `documentType`, `documentDate`, `notes` |
| `GET /patients/:id/documents` | read Patient | List with uploader name |
| `GET /patients/:id/documents/:documentId/file` | read Patient | **Streams** the file inline for preview |
| `DELETE /patients/:id/documents/:documentId` | update Patient | Soft delete (file kept for audit) |

**Document security:**

- Files are stored in `uploads/documents/`, which is gitignored and never served statically.
- The streaming endpoint checks that the document belongs to `:id`.
- It also checks that the stored path resolves **inside** the uploads folder.
- `documentType` must be one of: `referral_letter`, `lab_report`, `imaging`, `discharge_summary`, `prescription`, `medical_report`, `other`.

### 7.4 Appointments: `routes/appointment.route.ts` (see also `AppointmentApiDocumentation.md`)

| Method & path | Perm | What it does |
| --- | --- | --- |
| `POST /doctors/:doctorId/schedules` | manage Appointment | `{ schedules: [{dayOfWeek 0-6, startTime "HH:mm", endTime, slotDurationMinutes}], leaves: [{startDate, endDate, reason}] }`. **Replaces the whole weekly schedule**; leaves are added. |
| `GET /doctors/:doctorId/schedules` | read Appointment | Current week template + upcoming leave |
| `GET /doctors/:doctorId/availability?startDate&endDate` | read Appointment | Computed slots `{date, time, status: available\|booked\|blocked}`; a day off or leave is one `ALL_DAY` blocked slot |
| `POST /appointments` | create Appointment | `{patientId, doctorId, appointmentType, priority, reason, appointmentDate, appointmentTime}` |
| `GET /appointments/:id` | read Appointment | With patient/doctor names (doctors: own only) |
| `PUT /appointments/:id/reschedule` | update Appointment | New date/time (same slot checks) |
| `PATCH /appointments/:id/cancel` | update Appointment | `{reason}` required (audited) |
| `PATCH /appointments/:id/status` | update Appointment | Enforces transitions; `cancelled` needs a reason |
| `GET /appointments/reports?doctorId&patientId&startDate&endDate&status` | read Report | **The appointment list** used everywhere (narrowed per role, see §4) |
| `POST /appointments/send-reminders` | manage Appointment | Lists appointments in the next 24 h as `QUEUED_FOR_NOTIFICATION` (no SMS/email is sent yet) |

**How booking stays correct:**

- **Slot checks:** the slot must lie inside the doctor's working hours, not fall on leave, and not already be booked.
- **Concurrency:** booking runs in a transaction holding a Postgres **advisory lock** per `doctor + date + time`, so two receptionists can't book the same slot.
- **Time zone:** all slot maths is in UTC.
- **Allowed status moves:**
  - `scheduled` → confirmed, checked_in, cancelled or no_show
  - `confirmed` → checked_in, cancelled or no_show
  - `checked_in` → completed or cancelled
  - `completed`, `cancelled` and `no_show` are final.
- **Billing:** booking creates a consultation charge. Cancelling (through either endpoint) **waives** it if it hasn't been invoiced.

### 7.5 Vitals: `routes/vital.route.ts`

| Method & path | Perm |
| --- | --- |
| `POST /vitals` `{patientId, temperature, bloodPressureSystolic, bloodPressureDiastolic, heartRate, respiratoryRate, oxygenSaturation, weight, height}` | create Vitals (Nurse) |
| `GET /vitals/patient/:patientId` · `GET /vitals/patient/:patientId/audit?timeframe=today\|yesterday\|lastweek\|lastmonth\|history` | read Vitals |
| `GET /vitals/search?name` · `GET /vitals/:id` · `PATCH /vitals/:id` · `DELETE /vitals/:id` (soft) | read / update / delete Vitals |

Recording vitals creates a **vitals charge**.

### 7.6 Consultations: `routes/consultation.route.ts`

| Method & path | Perm |
| --- | --- |
| `POST /consultation` `{doctorId, patientId, chiefComplaint*, historyOfPresentIllness*, medicalHistory, physicalExamination, preliminaryDiagnosis, investigationRequirements}` | write Consultation |
| `GET /consultation/patient/:patientId/audit?timeframe=…` | read Consultation. Returns `{consultation, patient, doctor}` rows (used by the medical record) |
| `GET /consultation/patient/:patientId` · `GET /consultation/search?name` · `GET /consultation/:id` | read |
| `PATCH /consultation/:id` · `DELETE /consultation/:id` | update / delete |

### 7.7 Laboratory: `routes/labTestConfig.route.ts`, `routes/labTestResults.route.ts`

**Test templates (`/labtest`, subject `Lab_test`).** Each test defines its own form in `formSchema`:

```json
[{ "id": "haemoglobin", "label": "Haemoglobin (g/dL)", "type": "number", "required": true, "validation": { "min": 12, "max": 17.5 } },
 { "id": "result", "label": "Result", "type": "select", "options": ["Negative", "Positive"] }]
```

`GET/POST /labtest`, `GET/PUT/DELETE /labtest/:id` (delete = archive).

**Results (`/test-results`, subject `Laboratory`).**

| Method & path | What it does |
| --- | --- |
| `POST /test-results` `{labTestTemplateId, patientId, doctorId, values, notes}` | Saves a result and **sends it to `doctorId`**. Creates a **lab charge** for that test. |
| `GET /test-results?doctorId` | Results inbox with test/patient/doctor names. **Doctors always get only results sent to them.** |
| `GET /test-results/patient/:patientId` | History with `template`, `technician` and `doctor` (newest first) |
| `GET/PUT/DELETE /test-results/:id` | One result / correct / archive |

Values outside a field's `min`/`max` are allowed, since they're real readings; the frontend flags them as abnormal.

### 7.8 Pharmacy: `medicine`, `prescription`, `prescriptionItem` routes

| Method & path | Perm | Notes |
| --- | --- | --- |
| `/medicine` CRUD, `GET /medicine/search?q` | Medicine | `{code (unique), genericName, drugName, dosageForm, strength, price, stock, statusId}` |
| `POST /prescriptions` `{patientId, doctorId, statusId (pending), notes}` | write Prescription | Doctor writes it… |
| `POST /prescription-items` `{prescriptionId, medicineId, dosage, frequency, durationOfTime, quantity, instruction}` | write Prescription | …one line per medicine |
| `GET /prescriptions?status=pending` | read Prescription | **Pharmacy queue**, with patient/doctor/status |
| `POST /prescriptions/:id/dispense` | update Prescription | **Dispensing**: see below |
| `GET /prescriptions/patient/:id`, `/search?name`, `/:id`; `PATCH /:id`; `DELETE /:id` | read / update / delete | `PATCH` with the `cancelled` status id cancels |
| `GET /prescription-items/prescription/:id` etc. | read Prescription | Lines of a prescription |

**Dispensing is one transaction (`prescription.repository.ts → dispense`):**

1. Lock the prescription row (`FOR UPDATE`) and refuse if it isn't `pending` (409).
2. Lock every medicine on it and add up quantities per medicine.
3. If any medicine is short, refuse with `INSUFFICIENT_STOCK: Ciprofloxacin 500mg (need 14, have 8)` (409). **Nothing changes.**
4. Deduct stock and set the status to `dispensed`.
5. After commit, create **one pharmacy charge per medicine × quantity**.

Two pharmacists pressing Dispense together means one succeeds, the other gets 409, and stock is deducted once. **Prescribing is never billed; dispensing is.**

### 7.9 Billing: `routes/billing.route.ts`, `invoice*.routes.ts`, `services/billing.service.ts`

Billing runs **behind the scenes**. Clinical staff never see it; Cashier, Accountant, Admin (and Clinic Manager, read-only) do.

**1. Price list (`billable_services`), discovered automatically.** Every call to `GET /billing/services` runs `syncCatalog()`, which makes sure a service exists for:

| Code | Source | Category / department | Starting price |
| --- | --- | --- | --- |
| `REGISTRATION` | fixed | registration / Reception | unpriced |
| `VITALS` | fixed | nursing / Nursing | unpriced |
| `CONSULTATION:<type>` | each appointment type (defaults + any used) | consultation / Outpatient | unpriced |
| `LAB:<testId>` | each lab test template | laboratory / `Laboratory · <category>` | unpriced |
| `MED:<medicineId>` | each medicine | pharmacy / Pharmacy | the medicine's price |
| `CUSTOM:<NAME>` | added by billing (`POST /billing/services`) | any | as entered |

A new lab test or medicine therefore appears on the price list without any extra work. **Only billing staff set prices** (`PATCH /billing/services/:id {price, isActive, name}`).

**2. Charges (`service_charges`), recorded automatically.** The clinical services call these hooks after their own work succeeds:

| Event | Hook | Charged |
| --- | --- | --- |
| Cash patient registered | `chargeRegistration` | `REGISTRATION` (NHIF/insured patients: no charge) |
| Appointment booked | `chargeAppointment` | `CONSULTATION:<type>`; **waived** on cancel |
| Vitals recorded | `chargeVitals` | `VITALS` |
| Lab result entered | `chargeLabResult` | `LAB:<testId>` |
| Prescription dispensed | `chargeDispense` | `MED:<id>` × quantity per medicine |
| Billing adds one by hand | `POST /billing/charges` | any service (e.g. a custom "Antenatal care visit") |

**How charges behave:**

- **Never block patient care.** A charge failure is logged (`[billing] …`), never thrown back into the clinical request.
- **Payer recorded.** Each charge copies the patient's `paymentMode` into `payer`. `CASH` is paid at the desk; `NHIF`/`INSURANCE` are claims.
- **No double charges.** A unique index on `(source_type, source_id, service_id)` stops the same event being charged twice.
- **Price frozen when charged.** `unit_price` and `amount` are copied at charge time, so changing a price later doesn't rewrite history.
- **Unpriced charges.** A charge made while its service has no price is stored with `amount = NULL`. When billing sets the price, those waiting unbilled charges pick it up automatically (`pricedCharges` in the response).
- **Status:** a charge is `unbilled`, then either `invoiced` or `waived`.

**3. Invoicing.** `POST /billing/charges/invoice {patientId, chargeIds}` runs one transaction:

1. Lock the charges.
2. Refuse if any belongs to another patient, is already invoiced or waived, or is unpriced.
3. Create an `unpaid` invoice (`INV-YYYYMMDD-NNNN`) with one line per charge.
4. Mark the charges `invoiced`.

Manual invoices still work through `/invoices` and `/invoice-items`. Invoice status (`unpaid`, `partially_paid`, `paid`, `void`) is changed with `PUT /invoices/:id {statusId}`.

**4. Patient balance (for reception).** `GET /billing/balance/:patientId` requires `read PatientBalance`, so Receptionists get it without the rest of billing. It returns:

- `amountDue` = cash charges not yet invoiced + unpaid/partially-paid cash invoices (insurance-claim invoices excluded)
- `notYetInvoiced`, `unpaidInvoices`, `coveredByInsurance`, `unpricedCount`, plus the line items

**Other billing endpoints:** `GET /billing/charges?status&patientId&category&payer` and `PATCH /billing/charges/:id/waive {waived}`.

### 7.10 Statuses

`GET /statuses?groupType=medicine|prescription|invoice` is readable by any signed-in user. Defaults come from `DEFAULT_STATUSES` in `services/status.service.ts`.

---

## 8. A patient's journey through the system

```text
Reception   POST /patient (paymentMode CASH)          → charge: REGISTRATION
            POST /appointments                        → charge: CONSULTATION:Consultation
            GET  /billing/balance/:id                 → tells the patient what they owe
Nurse       POST /vitals                              → charge: VITALS
            PATCH /appointments/:id/status checked_in
Doctor      POST /consultation
            (lab request is verbal / in investigationRequirements)
Lab         POST /test-results {doctorId}             → charge: LAB:<test>; doctor sees it in GET /test-results
Doctor      POST /prescriptions + /prescription-items (not billed)
Pharmacy    POST /prescriptions/:id/dispense          → stock deducted; charge: MED:<id> × qty
Billing     GET  /billing/charges?patientId           → POST /billing/charges/invoice → invoice
            PUT  /invoices/:id {statusId: paid}
```

---

## 9. Changing the database

The migrations folder is gitignored and `drizzle-kit push` is interactive, so the team keeps the schema in step like this:

1. **Edit `src/drizzle/schema.ts`.** It is the source of truth.
2. **Apply the change** with `npx drizzle-kit push` on your own database, or with an equivalent SQL statement through `psql "$DATABASE_URL"`.
   - If you write SQL by hand, name foreign keys the Drizzle way (`<table>_<column>_<reftable>_<refcolumn>_fk`), so a later `push` sees no difference.
3. **Tell the team.** Everyone else runs `npx drizzle-kit push`.
4. **Making a column NOT NULL:** fill existing rows first, or give it a default.

---

## 10. Adding a new module

1. **Schema:** add the table(s) to `schema.ts` (spread `...auditLogs`), then apply the change (§9).
2. **Repository:** `repositories/<x>.repository.ts`, Drizzle queries only. Use `db.transaction` plus `.for("update")` when concurrent users could clash.
3. **Service:** `services/<x>.service.ts`, holding validation and business rules. Throw `"CODE: message"` errors.
4. **Controller:** `controllers/<x>.controller.ts`. Map error codes to statuses and return `{ success, data }`.
5. **Route:** `routes/<x>.route.ts`, using `authenticateToken` and `checkAbility(action, subject)` on **every** route. Register fixed paths before `/:id`.
6. **Mount it** in `app.ts` under `/api/v1/...`.
7. **Permissions:** add the subject to `Subjects` and grant rules in `config/ability.ts`, then mirror them in the frontend's `src/config/ability.ts`.
8. **Billing:** if the action should be billed, call a `recordCharge`-style helper from `billing.service.ts` after the work succeeds, and add its code to `syncCatalog`.
9. **Middleware typing:** custom middleware must be typed `RequestHandler<any>`, otherwise TypeScript rejects it alongside handlers typed `Request<{ id: string }>`.

---

## 11. Testing and test accounts

**Before pushing:**

```bash
npx tsc -p src/tsconfig.json --noEmit
```

**Scripted API tests:** run a throwaway instance so you don't hit the login rate limit on your main server:

```bash
PORT=5990 CLIENT_URL=http://localhost:5173 npx tsx src/app.ts
```

**Development accounts** (local database only). Every password is `Abc@2026.` (with the final period).

| Role | Email | Department (head ★) |
| --- | --- | --- |
| Admin | `admin@hms.test` | Administration |
| Clinic Manager | `manager@hms.test` | Administration ★ |
| Receptionist | `reception@hms.test` | Administration |
| Doctor | `doctor@hms.test` | Medical Department ★ |
| Nurse | `nurse@hms.test` | Medical Department |
| Lab Technician | `lab@hms.test` | Laboratory ★ |
| Pharmacist | `pharmacist@hms.test` | Pharmacy ★ |
| Cashier | `cashier@hms.test` | Accounts & Billing |
| Accountant | `accountant@hms.test` | Accounts & Billing ★ |

**Sample data:**

- 20 patients with NHIF cards `NHIF-TEST-0001…0020`, plus the cash patient Salome Mrema
- 15 lab tests and 12 medicines (Ciprofloxacin deliberately low on stock)
- departments ADM, MED, LAB, ACC, PHA

**Creating the first Admin on a fresh database:**

```bash
HASH=$(node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'YourPassword')
psql "$DATABASE_URL" -c "INSERT INTO \"user\" (first_name,last_name,email,phone_number,password,role) VALUES ('System','Admin','admin@example.com','0700000000','$HASH','Admin');"
```

---

## 12. Known limitations

- **Payments aren't recorded per transaction** (the `payments` table has no endpoints). A `partially_paid` invoice counts at its full amount in the patient balance.
- **Appointment reminders aren't delivered.** They're listed as `QUEUED_FOR_NOTIFICATION`; no SMS or email is sent.
- **Insurance, inventory, wards/beds/rooms, next of kin and diagnosis tables have no API yet.**
- **Multi-step saves aren't atomic.** Prescriptions and manual invoices are created as a header plus separate line requests; if a line fails, the header remains.
- **`labTest.service.ts` is unfinished** (lab orders/sample tracking) and excluded from the build in `src/tsconfig.json` until `labTest.repository.ts` exists.
- **The deploy workflow doesn't build.** `.github/workflows/backend-deploy.yml` runs `npm install` + `pm2 restart` without `npm run build`.
