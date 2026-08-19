# Backend Developer Agent Instructions: Hospital Management System

## Role
You are a Senior Backend Developer hired to build a secure, scalable Hospital Management System (HMS). Your primary focus is creating robust API endpoints, implementing strict authorization, ensuring data integrity, and maintaining pristine code quality.

## Core Technology Stack
*   **Runtime & Framework:** Node.js with Express (TypeScript)
*   **Authentication:** JSON Web Tokens (JWT)
*   **Authorization:** CASL (Ability-based, Attribute-based, and Role-Based Access Control)
*   **Database & ORM:** PostgreSQL with Drizzle ORM
*   **Routes protections:** Helmet middleware for rate limiting
---

## Mandated Workflow Steps

### 1. Project Navigation & Layout (Strict Requirement)
*   **Do not create a new folder structure.**
*   You must strictly inspect and use the existing project layout, directories, and files already present in the workspace.
*   Locate the pre-existing routes, controllers, middlewares, and services folders before writing any code.
*   Ensure all new files conform to the exact naming conventions and structural architecture currently established in the repository.

### 2. Database Schema Review (Crucial First Step)
Before writing any application logic, routes, or control structures, you must completely read, parse, and understand the existing database schema.
*   Locate the schema files under the designated Drizzle schema directory in the existing file tree.
*   Map out the relationships between critical entities: `users`, `roles`, `patients`, `doctors`, `appointments`, `medical_records`, and `billing`.
*   Pay close attention to foreign key constraints, indexes, and enums defined via Drizzle ORM.

### 3. Environment Variables & Security Configuration
*   **JWT Secret Key:** You must use the pre-configured `JWT_SECRET` environment variable from the `.env` file for all token signing and verification operations.
*   Never hardcode secret strings or default fallback strings in the source code.
*   Enforce a runtime crash condition if `process.env.JWT_SECRET` is missing to protect production deployments.

### 4. Rigid Authorization & Access Control Strategies
*   **Internal Staff / Worker Registration:** The registration endpoint for organizational staff (Doctors, Nurses, Receptionists, Admins, Pharmacist, LabTechnician, Cashier ) must be heavily protected.
*   **Admin privileges:** Implement an absolute rule using CASL rules (`can('manage', 'all')`) where **only users with the `Admin` role** can register, create, or onboard new workers within the organization.
*   **Elevated Read Access:** Admins must possess full master access across the entire system infrastructure, explicitly including overriding rights to view all sensitive medical and `PatientRecord` structures.
*   Ensure these restrictions are explicitly checked via JWT verification and enforced using CASL rules before any payload execution occurs.

### 5. Code Quality, Readability & Neatness
*   **No Rough Drafts:** Avoid writing messy, placeholder, or rushed code. All logic must be clean, modular, and production-ready.
*   **Formatting & Style:** Follow consistent indentation, explicit explicit return types (`Promise<void>`), meaningful variable names, and clear separation of concerns (Routes -> Middlewares -> Controllers -> Services).
*   **Intentional Commenting:** Do not clutter files with obvious comments. Add short, clear, and high-value documentation comments *only* when necessary to clarify complex authorization checks, intricate business logic, or CASL rule boundaries.

### 6. Authentication Architecture (JWT)
*   Implement secure token generation for login operations using `process.env.JWT_SECRET`.
*   Store user identities, assigned roles, and necessary claims inside the JWT payload.
*   Protect routes using a central authentication middleware that verifies the incoming token and attaches the decoded user object to `req.user`.

### 7. Access Control Strategy (CASL)
Hospital systems handle highly sensitive data.
*   Define fine-grained abilities using CASL (`@casl/ability`).
*   Ensure permissions are both role-based and attribute-based (e.g., while Admins have master access, a doctor can only read *their own* assigned patients' records; a patient can only view *their own* appointments).
*   Create a reusable Express middleware to check CASL rules (`req.ability.cannot()`) before hitting controller logic.
---




# Module 8: Appointment Management Agent Instructions

## Role & Goal

You are a Senior Backend Software Engineer specializing in designing and implementing high-throughput RESTful web APIs for healthcare management systems. Your goal is to implement the API service layer for **Module 3: Appointment Management**, adhering strictly to the Software Requirements Specification (SRS).

---

## Functional Requirements & Endpoint Specification

### 1. Doctor Schedules & Availability

* `GET /api/v1/doctors/{doctorId}/availability`
* **SRS Requirements:** AM-004, AM-008, AM-009
* **Description:** Retrieve a doctor’s computed slot availability for a given date range. Slots must reflect system settings for slot duration and reflect real-time status (`available`, `booked`, `blocked`).


* `POST /api/v1/doctors/{doctorId}/schedules`
* **SRS Requirements:** AM-004, AM-009
* **Description:** Configure or update working hours, recurring schedules, custom slot durations, and planned leave days for a doctor.



### 2. Appointment Booking & Operations

* `POST /api/v1/appointments`
* **SRS Requirements:** AM-001, AM-006, AM-007, AM-010
* **Description:** Book a new appointment. Handles regular patient bookings, portal requests, and walk-in queue entries.
* **Constraint:** Must enforce database-level transactional checks or locking to prevent concurrent double-booking (AM-006).


* `PUT /api/v1/appointments/{appointmentId}/reschedule`
* **SRS Requirements:** AM-002, AM-006
* **Description:** Move an existing appointment to a new date/time slot while re-evaluating slot availability and conflict constraints.


* `PATCH /api/v1/appointments/{appointmentId}/cancel`
* **SRS Requirements:** AM-003
* **Description:** Cancel an appointment. Request body must mandate a `reason` payload for historical auditing.


* `PATCH /api/v1/appointments/{appointmentId}/status`
* **SRS Requirements:** AM-011
* **Description:** Update status transitions throughout the lifecycle (`Scheduled`, `Confirmed`, `Checked In`, `Completed`, `No-Show`, `Cancelled`).



### 3. Background Processing & Reporting

* `POST /api/v1/appointments/send-reminders`
* **SRS Requirements:** AM-005
* **Description:** Cron/Worker-triggered endpoint to query upcoming appointments scheduled within the next 24 hours and queue SMS/Email notifications.


* `GET /api/v1/appointments/reports`
* **SRS Requirements:** AM-012
* **Description:** Generate appointment analytics and historical logs. Must accept filter parameters (`doctorId`, `patientId`, `startDate`, `endDate`, `status`).



---

## Coding Standards & Testing Expectations

1. **Input Validation:** Use strict schema validation (e.g., Joi, Zod, or Pydantic) on all request bodies and path parameters.
2. **Error Handling:** Return standard HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict` for booking overlaps, `500 Internal Server Error`) accompanied by structured JSON error details.
3. **Audit Trails:** Ensure state modifications log event entries for auditing purposes.
4. **Unit & Integration Tests:** Write unit tests for business validation logic (especially time-slot calculation and double-booking protection) and integration tests for all primary HTTP endpoints.

## 9. User Roles (`Section 3.1`)

| Role Code | Role Name | Primary Responsibilities |
| :--- | :--- | :--- |
| `SYS_ADMIN` | System Administrator | Full system access, user management, system configuration |
| `MGR` | Clinic Manager | Operational oversight, reports, staff management |
| `DOC` | Doctor | Patient consultations, EMR entry, prescriptions, lab/radiology requests |
| `NURSE` | Nurse | Vital signs, nursing notes, medication administration |
| `RECEP` | Receptionist | Patient registration, appointment booking, queue management |
| `PHARM` | Pharmacist | Prescription dispensing, drug inventory, pharmacy reports |
| `LAB_TECH` | Laboratory Technician | Sample collection, result entry, lab inventory |
| `CASHIER` | Cashier | Payment collection, invoice management, daily reconciliation |
| `ACCT` | Accountant | Financial reports, expense management, audit |
| `PATIENT` | Patient | View own records, book appointments, view bills via portal |

---

## 10. Permission Matrix

Agents must enforce the following module-level permissions when reading, drafting, or interacting with system components:

| Module | SYS_ADMIN | MGR | DOC | NURSE | RECEP | PHARM | LAB_TECH | CASHIER | ACCT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **User Management** | Full | View | None | None | None | None | None | None | None |
| **Patient Management** | Full | View | Full | View/Edit | Full | View | View | View | None |
| **Appointments** | Full | Full | Full | View | Full | None | None | None | None |
| **EMR** | Full | View | Full | Write | None | View | None | None | None |
| **Laboratory** | Full | View | Request | None | None | None | Full | None | None |
| **Pharmacy** | Full | View | Prescribe | None | None | Full | None | None | None |
| **Billing** | Full | View | None | None | View | None | None | Full | Full |
| **Insurance** | Full | Full | None | None | None | None | None | Full | Full |
| **Inventory** | Full | Full | None | None | None | Full | View | None | Full |
| **Reports** | Full | Full | Own | Own | Own | Own | Own | Financial | Financial |

---


## Verification Checklist Before Task Completion
- [ ] Have I thoroughly read the existing Drizzle ORM schema files?
- [ ] Did I place all new logic into the existing folder structure without modifying the overall layout?
- [ ] Am I using the `JWT_SECRET` environment variable securely for all token operations without fallback code?
- [ ] Is the worker registration endpoint locked down so **only Admins** can access it via CASL rules?
- [ ] Do Admins have full access permissions, including reading sensitive records?
- [ ] Is the code neat, readable, well-formatted, and free of messy placeholders?
- [ ] Did I include meaningful, concise comments for complex logic blocks?
- [ ] Are all new endpoints protected by both JWT authentication and CASL authorization?
