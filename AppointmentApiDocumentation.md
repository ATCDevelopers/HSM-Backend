# Appointment Module — Frontend API Guide

Audience: React frontend team. Everything below reflects how the API behaves today on
`feat/appointment-filter`.

---

## 1. Basics

**Base URL**

```
http://localhost:5000/api/v1
```

The port comes from `PORT` in the backend `.env` and falls back to `5000`. Confirm the value
with us before hardcoding — put it in `VITE_API_BASE_URL`.

**Authentication**

Every endpoint in this module requires a JWT access token:

```
Authorization: Bearer <accessToken>
```

Access tokens last **12 hours**. The refresh token is an `httpOnly` cookie valid for 7 days;
rotate it with `POST /api/v1/auth/refresh-token`. Because that cookie is `httpOnly`, your
axios instance needs `withCredentials: true`, and the backend `CLIENT_URL` must match your
dev server origin exactly or CORS will reject the request.

> There is **no `/auth/login` endpoint yet**. A token currently only comes back from
> registration or from refresh. Talk to us before building a login screen.

**Response envelope**

Success is always:

```json
{ "message": "human readable summary", "data": {} }
```

Errors are always:

```json
{ "error": "human readable reason" }
```

This differs from the patient module, which returns `{ success, message, data }`. Do not
share one response parser between the two.

---

## 2. Endpoint index

| # | Method | Path | Purpose | Permission needed |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/doctors/:doctorId/availability` | Computed slot grid for a date range | read Appointment |
| 2 | `POST` | `/doctors/:doctorId/schedules` | Set working hours + leave days | manage Appointment |
| 3 | `POST` | `/appointments` | Book an appointment | create Appointment |
| 4 | `PUT` | `/appointments/:appointmentId/reschedule` | Move to a new slot | update Appointment |
| 5 | `PATCH` | `/appointments/:appointmentId/cancel` | Cancel with a reason | update Appointment |
| 6 | `PATCH` | `/appointments/:appointmentId/status` | Advance the lifecycle | update Appointment |
| 7 | `POST` | `/appointments/send-reminders` | Build the 24h reminder batch | manage Appointment |
| 8 | `GET` | `/appointments/reports` | Filterable history / analytics | read Report |

Which roles hold which permission:

| Role | Can read | Can create / update | Can manage |
| :--- | :-: | :-: | :-: |
| `Admin` | yes | yes | yes |
| `ClinicManager` | yes | yes | yes |
| `Doctor` | yes | yes | yes |
| `Receptionist` | yes | yes | yes |
| `Nurse` | yes | **no** | no |
| `Patient` | own only | own only | own only |
| `Pharmacist`, `LabTechnician`, `Cashier`, `Accountant` | no | no | no |

A role without the permission gets **403** before your payload is ever read, so hide the
relevant UI rather than letting the user submit and fail. A `Nurse` can view schedules but
cannot book, reschedule, cancel, or change status.

---

## 3. Shared types

Paste these into your TypeScript types folder.

```ts
export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'checked_in'
  | 'completed' | 'cancelled'  | 'no_show';

export type AppointmentPriority = 'low' | 'medium' | 'high' | 'emergency';

export type SlotStatus = 'available' | 'booked' | 'blocked';

export interface Slot {
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:mm", or the literal "ALL_DAY" when status is "blocked"
  status: SlotStatus;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string | null;        // null for an unassigned walk-in
  appointmentType: string;
  priority: AppointmentPriority;
  status: AppointmentStatus;
  reason: string;
  appointmentDate: string;        // full ISO timestamp, e.g. "2026-09-01T00:00:00.000Z"
  appointmentTime: string;        // "HH:mm"
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}
```

**Two formatting rules that will bite you if ignored:**

1. `appointmentTime` must be zero-padded 24-hour `HH:mm`. `"9:00"` is rejected with 400 —
   send `"09:00"`.
2. Send `appointmentDate` as a plain `"YYYY-MM-DD"` date. The server normalises it to UTC
   midnight, so it comes back as a full ISO timestamp — render only the date part, and never
   feed the returned value through a local-timezone formatter or it may show the day before.

---

## 4. `GET /doctors/:doctorId/availability`

Returns the doctor's slot grid, computed live from their weekly schedule, approved leave, and
existing bookings. Nothing is cached — call it again after every booking.

**Query params** — both required.

| Param | Format | Notes |
| :--- | :--- | :--- |
| `startDate` | `YYYY-MM-DD` | Inclusive |
| `endDate` | `YYYY-MM-DD` | Inclusive; must not be earlier than `startDate` |

**Request**

```
GET /api/v1/doctors/3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761/availability?startDate=2026-09-01&endDate=2026-09-02
Authorization: Bearer <accessToken>
```

**200 OK**

```json
{
  "message": "Doctor slot availability retrieved successfully",
  "data": {
    "doctorId": "3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761",
    "startDate": "2026-09-01",
    "endDate": "2026-09-02",
    "slots": [
      { "date": "2026-09-01", "time": "08:00", "status": "available" },
      { "date": "2026-09-01", "time": "08:30", "status": "booked" },
      { "date": "2026-09-01", "time": "09:00", "status": "available" },
      { "date": "2026-09-02", "time": "ALL_DAY", "status": "blocked" }
    ]
  }
}
```

**The `ALL_DAY` case — please special-case this.** When a whole day is unavailable (approved
leave, a non-working weekday, or no schedule configured), the API emits **one** entry for that
day with `time: "ALL_DAY"` instead of a list of blocked slots. Rendering it in a time grid
without a guard will produce a stray "ALL_DAY" cell.

Suggested grouping for a calendar view:

```ts
function groupByDay(slots: Slot[]) {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {});
}

const isDayOff = (daySlots: Slot[]) =>
  daySlots.length === 1 && daySlots[0].time === 'ALL_DAY';
```

**Errors**

| Status | When |
| :-: | :--- |
| 400 | `startDate` or `endDate` missing, unparseable, or `startDate > endDate` |
| 401 | No token |
| 403 | Token invalid/expired, or role lacks `read Appointment` |

---

## 5. `POST /doctors/:doctorId/schedules`

Sets a doctor's weekly working hours and optionally records leave days.

**Request body**

```json
{
  "schedules": [
    { "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00", "slotDurationMinutes": 30, "isWorkingDay": true },
    { "dayOfWeek": 2, "startTime": "08:00", "endTime": "13:00", "slotDurationMinutes": 20, "isWorkingDay": true },
    { "dayOfWeek": 0, "startTime": "00:00", "endTime": "23:59", "isWorkingDay": false }
  ],
  "leaves": [
    { "startDate": "2026-09-10", "endDate": "2026-09-12", "reason": "Conference" }
  ]
}
```

| Field | Required | Rules |
| :--- | :-: | :--- |
| `schedules` | yes | Array. May be empty (clears the week) |
| `schedules[].dayOfWeek` | yes | Integer `0`–`6`, **`0` = Sunday** |
| `schedules[].startTime` | yes | `HH:mm`, must be earlier than `endTime` |
| `schedules[].endTime` | yes | `HH:mm` |
| `schedules[].slotDurationMinutes` | no | Positive integer, defaults to `30`. Cannot exceed the working window |
| `schedules[].isWorkingDay` | no | Defaults to `true`. Set `false` to mark a day off |
| `leaves` | no | Array |
| `leaves[].startDate` / `endDate` | yes if `leaves` sent | Date string, both inclusive |
| `leaves[].reason` | no | Free text |

**`schedules` is a full replace, not a merge.** Whatever you send becomes the doctor's entire
week; days you omit are cleared. Always submit the complete weekly form, not just the row the
user edited.

**`leaves` only ever appends.** There is no endpoint to remove a leave entry yet — do not build
a delete button for it.

**200 OK**

```json
{
  "message": "Doctor schedule updated successfully",
  "data": {
    "schedules": [ { "id": "...", "doctorId": "...", "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00", "slotDurationMinutes": 30, "isWorkingDay": true } ],
    "leaves":    [ { "id": "...", "doctorId": "...", "startDate": "2026-09-10T00:00:00.000Z", "endDate": "2026-09-12T00:00:00.000Z", "reason": "Conference" } ]
  }
}
```

**Errors**

| Status | Message shape |
| :-: | :--- |
| 400 | `"Request body must contain a \"schedules\" array."` |
| 400 | `"Each schedule entry must contain a valid dayOfWeek (0 for Sunday to 6 for Saturday)."` |
| 400 | `"startTime and endTime must use 24-hour HH:mm format (e.g. \"08:00\", \"17:30\")."` |
| 400 | `"Invalid working hours for dayOfWeek 1: startTime must be earlier than endTime."` |
| 400 | `"slotDurationMinutes must be a positive whole number of minutes."` |
| 403 | Role lacks `manage Appointment` |

---

## 6. `POST /appointments`

Books an appointment. Covers normal bookings, patient-portal requests, and walk-ins.

**Request body**

```json
{
  "patientId": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
  "doctorId": "3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761",
  "appointmentType": "Checkup",
  "priority": "medium",
  "reason": "Persistent headache for two weeks",
  "appointmentDate": "2026-09-01",
  "appointmentTime": "09:00"
}
```

| Field | Required | Notes |
| :--- | :-: | :--- |
| `patientId` | yes | UUID from the patients table |
| `doctorId` | no | Omit for an unassigned walk-in. **All slot validation is skipped when omitted** |
| `appointmentType` | yes | Free text, e.g. `"Checkup"`, `"Follow-up"`, `"Surgery"` |
| `priority` | no | `low` \| `medium` \| `high` \| `emergency`, defaults to `medium` |
| `reason` | yes | Free text, non-empty |
| `appointmentDate` | yes | `YYYY-MM-DD` |
| `appointmentTime` | yes | `HH:mm`, must be a real slot start (see below) |

**The time must be a slot the availability endpoint reported as `available`.** The server now
re-validates against the doctor's schedule, so booking `08:15` on a 30-minute grid, a time
outside working hours, a non-working weekday, or a leave day is rejected. Drive your time picker
from the availability response rather than a free-text input.

**201 Created** — `data` is the full `Appointment` object.

```json
{
  "message": "Appointment booked successfully",
  "data": {
    "id": "c62bf6a9-83ab-4ef1-968b-841804f5e042",
    "patientId": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
    "doctorId": "3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761",
    "appointmentType": "Checkup",
    "priority": "medium",
    "status": "scheduled",
    "reason": "Persistent headache for two weeks",
    "appointmentDate": "2026-09-01T00:00:00.000Z",
    "appointmentTime": "09:00",
    "createdAt": "2026-08-27T10:25:00.000Z"
  }
}
```

**Errors** — the 400/409 split tells you what to do next.

| Status | Example message | What the UI should do |
| :-: | :--- | :--- |
| 400 | `"Missing required fields. Required: patientId, appointmentType, reason, appointmentDate, appointmentTime."` | Fix the form |
| 400 | `"appointmentTime must use 24-hour HH:mm format (e.g. \"09:00\", \"14:30\")."` | Fix the form |
| 400 | `"INVALID_SLOT: 08:15 is not a slot start. Slots begin every 30 minutes from 08:00."` | Fix the form |
| 400 | `"INVALID_SLOT: 19:00 is outside the doctor's working hours (08:00-17:00)."` | Fix the form |
| 409 | `"Conflict: The selected time slot is already booked for this doctor."` | Refetch availability, ask user to repick |
| 409 | `"Conflict: The doctor is on approved leave on 2026-09-10."` | Refetch availability |
| 409 | `"Conflict: The doctor has no working hours configured for 2026-09-06."` | Refetch availability |
| 403 | Role lacks `create Appointment` | Hide the button |

Rule of thumb: **400 means the input is wrong, 409 means the world changed** — on any 409,
refetch availability before showing the slot picker again.

---

## 7. `PUT /appointments/:appointmentId/reschedule`

Moves an appointment to a new slot, optionally reassigning the doctor.

**Request body**

```json
{
  "appointmentDate": "2026-09-03",
  "appointmentTime": "14:30",
  "doctorId": "9a7b1c22-4f31-4c88-9e10-77bd3f0a1c55"
}
```

| Field | Required | Notes |
| :--- | :-: | :--- |
| `appointmentDate` | yes | `YYYY-MM-DD` |
| `appointmentTime` | yes | `HH:mm` |
| `doctorId` | no | Send only to reassign; omitted keeps the current doctor |

**200 OK** — `data` is the updated `Appointment`.

Cannot reschedule an appointment whose status is `cancelled` or `completed`.

**Errors**

| Status | Example message |
| :-: | :--- |
| 400 | `"Missing required fields. Required: appointmentDate and appointmentTime."` |
| 400 | `"INVALID_STATE: Cannot reschedule an appointment with status 'completed'"` |
| 400 | `"INVALID_SLOT: ..."` |
| 404 | `"Appointment not found"` |
| 409 | `"Conflict: Target time slot is already booked."` |
| 409 | `"Conflict: The doctor is on approved leave on 2026-09-10."` |

---

## 8. `PATCH /appointments/:appointmentId/cancel`

**Request body** — `reason` is mandatory and recorded in the audit trail.

```json
{ "reason": "Patient requested cancellation due to travel" }
```

**200 OK** — `data` is the appointment with `status: "cancelled"`.

**Errors**

| Status | Example message |
| :-: | :--- |
| 400 | `"Cancellation mandate: A non-empty \"reason\" string payload is required for auditing."` |
| 400 | `"Appointment is already cancelled"` |
| 404 | `"Appointment not found"` |

Make the reason field a required input in the cancel dialog — a whitespace-only string is
rejected too.

---

## 9. `PATCH /appointments/:appointmentId/status`

Advances the appointment through its lifecycle.

**Request body**

```json
{ "status": "checked_in" }
```

To cancel through this endpoint, a `reason` is **also required**:

```json
{ "status": "cancelled", "reason": "Patient did not confirm in time" }
```

**Only forward moves are allowed.** Use this table to decide which buttons to render — anything
not listed returns **409**.

| Current status | Allowed next values |
| :--- | :--- |
| `scheduled` | `confirmed`, `checked_in`, `cancelled`, `no_show` |
| `confirmed` | `checked_in`, `cancelled`, `no_show` |
| `checked_in` | `completed`, `cancelled` |
| `completed` | none — terminal |
| `cancelled` | none — terminal |
| `no_show` | none — terminal |

```ts
const NEXT_STATUSES: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled:  ['confirmed', 'checked_in', 'cancelled', 'no_show'],
  confirmed:  ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed', 'cancelled'],
  completed:  [],
  cancelled:  [],
  no_show:    [],
};
```

Resending the status the appointment already has also returns 409, so disable the current
status in your dropdown.

**200 OK** — `data` is the updated `Appointment`.

**Errors**

| Status | Example message |
| :-: | :--- |
| 400 | `"Invalid status parameter. Allowed values: scheduled, confirmed, checked_in, completed, cancelled, no_show"` |
| 400 | `"Cancellation mandate: setting status to \"cancelled\" requires a non-empty \"reason\" string payload for auditing."` |
| 404 | `"Appointment not found"` |
| 409 | `"Conflict: Cannot move from 'completed' to 'scheduled'. 'completed' is a terminal state"` |
| 409 | `"Conflict: Cannot move from 'scheduled' to 'completed'. Allowed next states: confirmed, checked_in, cancelled, no_show"` |
| 409 | `"Conflict: Appointment is already 'confirmed'"` |

---

## 10. `POST /appointments/send-reminders`

No request body. Collects every non-cancelled, non-completed, non-no-show appointment falling in
the next 24 hours and returns the reminder batch.

**200 OK**

```json
{
  "message": "Appointment reminders queued successfully",
  "data": {
    "processedCount": 2,
    "reminders": [
      {
        "appointmentId": "c62bf6a9-83ab-4ef1-968b-841804f5e042",
        "patientId": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
        "patientName": "John Doe",
        "patientEmail": "john.doe@example.com",
        "patientPhone": "+255711223344",
        "doctorName": "Asha Mwakalinga",
        "appointmentDate": "2026-08-28T00:00:00.000Z",
        "appointmentTime": "09:00",
        "status": "QUEUED_FOR_NOTIFICATION"
      }
    ]
  }
}
```

> **This endpoint does not actually send anything yet.** There is no SMS or email provider wired
> up — it only returns the batch it *would* send. It is intended for a cron worker, not for user
> interaction. If you need an admin "preview today's reminders" panel it is safe to call, but do
> not label the button "Send reminders" to users.
>
> `patientName` falls back to `"Valued Patient"` and `doctorName` to `"Assigned Doctor"` when the
> joined record is missing, and `patientEmail` / `patientPhone` can be empty strings — guard
> before rendering.

---

## 11. `GET /appointments/reports`

Filterable appointment history with patient and doctor names already joined in. This is the
endpoint to build list views, tables, and dashboards on.

**Query params** — all optional; omit them all to get everything you are allowed to see.

| Param | Format | Notes |
| :--- | :--- | :--- |
| `doctorId` | UUID | Ignored for `Doctor` role (forced to self) |
| `patientId` | UUID | Ignored for `Patient` role (forced to self) |
| `startDate` | `YYYY-MM-DD` | Inclusive |
| `endDate` | `YYYY-MM-DD` | Inclusive to end of day |
| `status` | `AppointmentStatus` | Single value only, not a list |

```
GET /api/v1/appointments/reports?status=scheduled&startDate=2026-09-01&endDate=2026-09-30
```

**200 OK** — `data` is a **flat array**, not the nested `Appointment` shape.

```json
{
  "message": "Appointment analytics and historical report generated",
  "data": [
    {
      "id": "c62bf6a9-83ab-4ef1-968b-841804f5e042",
      "patientId": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
      "patientFirstName": "John",
      "patientLastName": "Doe",
      "patientEmail": "john.doe@example.com",
      "doctorId": "3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761",
      "doctorFirstName": "Asha",
      "doctorLastName": "Mwakalinga",
      "appointmentType": "Checkup",
      "priority": "medium",
      "status": "scheduled",
      "reason": "Persistent headache for two weeks",
      "appointmentDate": "2026-09-01T00:00:00.000Z",
      "appointmentTime": "09:00",
      "createdAt": "2026-08-27T10:25:00.000Z"
    }
  ]
}
```

Doctor fields are `null` for unassigned walk-ins. There is **no pagination** — a wide date range
returns every matching row, so always send `startDate`/`endDate` and page client-side for now.

**What each role actually sees.** The server narrows results to the caller — you cannot widen
them by passing a different `doctorId`.

| Role | Result scope |
| :--- | :--- |
| `Admin`, `ClinicManager`, `Receptionist` | Everything; all filters honoured |
| `Doctor` | Only their own appointments. A `doctorId` in the query is overwritten |
| `Patient` | Only their own. **Known issue — currently returns `[]`, see §14** |
| `Nurse`, `Pharmacist`, `LabTechnician`, `Cashier`, `Accountant` | **403** |

**Errors**

| Status | Example message |
| :-: | :--- |
| 400 | `"INVALID_DATE: Invalid startDate filter."` |
| 400 | `"INVALID_DATE_RANGE: startDate cannot be after endDate."` |
| 403 | `"Forbidden: appointment reports are limited to your own records, and no ownership scope is defined for your role."` |

---

## 12. React integration

**Axios instance**

```ts
// src/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:5000/api/v1
  withCredentials: true,                      // required for the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // 403 covers both "expired token" and "no permission" in this API — see §14
    if (error.response?.status === 403 && !error.config._retried) {
      error.config._retried = true;
      try {
        const { data } = await api.post('/auth/refresh-token');
        localStorage.setItem('accessToken', data.data.accessToken);
        return api(error.config);
      } catch {
        localStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(error);
  }
);
```

**Service functions**

```ts
// src/api/appointments.ts
import { api } from './client';
import type { Appointment, AppointmentStatus, Slot } from '../types/appointment';

export const getAvailability = async (doctorId: string, startDate: string, endDate: string) => {
  const { data } = await api.get(`/doctors/${doctorId}/availability`, {
    params: { startDate, endDate },
  });
  return data.data as { doctorId: string; startDate: string; endDate: string; slots: Slot[] };
};

export const bookAppointment = async (payload: {
  patientId: string;
  doctorId?: string;
  appointmentType: string;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  reason: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
}) => {
  const { data } = await api.post('/appointments', payload);
  return data.data as Appointment;
};

export const rescheduleAppointment = async (
  id: string,
  payload: { appointmentDate: string; appointmentTime: string; doctorId?: string }
) => {
  const { data } = await api.put(`/appointments/${id}/reschedule`, payload);
  return data.data as Appointment;
};

export const cancelAppointment = async (id: string, reason: string) => {
  const { data } = await api.patch(`/appointments/${id}/cancel`, { reason });
  return data.data as Appointment;
};

export const updateStatus = async (id: string, status: AppointmentStatus, reason?: string) => {
  const { data } = await api.patch(`/appointments/${id}/status`, { status, reason });
  return data.data as Appointment;
};

export const getReports = async (filters: {
  doctorId?: string; patientId?: string;
  startDate?: string; endDate?: string; status?: AppointmentStatus;
}) => {
  const { data } = await api.get('/appointments/reports', { params: filters });
  return data.data;
};
```

**Error message helper**

Every error in this module is `{ error: string }`, so one extractor covers all eight endpoints.

```ts
export const apiError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return 'Something went wrong. Please try again.';
};
```

**Booking flow with conflict recovery**

The one pattern worth copying: a 409 means someone else took the slot while your user was
filling the form, so refetch availability instead of just showing the error.

```tsx
function BookingForm({ doctorId, patientId }: { doctorId: string; patientId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const range = { startDate: '2026-09-01', endDate: '2026-09-07' };

  const loadSlots = useCallback(async () => {
    const result = await getAvailability(doctorId, range.startDate, range.endDate);
    setSlots(result.slots);
  }, [doctorId]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const submit = async (date: string, time: string) => {
    setSaving(true);
    setError(null);
    try {
      await bookAppointment({
        patientId, doctorId,
        appointmentType: 'Checkup',
        reason: 'Persistent headache',
        appointmentDate: date,
        appointmentTime: time,
      });
    } catch (err) {
      setError(apiError(err));
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        await loadSlots(); // the world changed — resync the grid
      }
    } finally {
      setSaving(false);
    }
  };

  const bookable = slots.filter((s) => s.status === 'available');
  return null; // render `bookable`, `error`, `saving`
}
```

---

## 13. Status code reference

| Status | Meaning in this module | Frontend action |
| :-: | :--- | :--- |
| 200 | Success | Render `data` |
| 201 | Created (booking only) | Render `data`, refetch availability |
| 400 | Payload or query is wrong | Show field-level validation error |
| 401 | No `Authorization` header at all | Redirect to auth |
| 403 | Token invalid/expired **or** role lacks permission | Try refresh once, then redirect or show "not permitted" |
| 404 | Appointment id does not exist | Show "not found", refresh the list |
| 409 | Slot taken, doctor unavailable, or illegal status move | Refetch availability / status, ask user to retry |
| 500 | Unhandled server error | Generic retry message, report to us |

**Note on 401 vs 403.** The auth middleware returns **401** only when the header is missing
entirely, and **403** when the token is present but invalid or expired. So do not treat 403 as
"definitely a permissions problem" — attempt one silent refresh first, and only then decide it is
a permissions issue.

---

## 14. Known limitations — please read before estimating

1. **No login endpoint.** `POST /auth/login` does not exist. Tokens currently only come from
   registration or refresh. We will add it; do not block on it silently.
2. **Patient-role reports return an empty array.** The scoping uses the JWT's `user.id` as the
   `patientId`, but those are two different tables linked through a pivot. It fails safe — a
   patient never sees another patient's data — but the patient portal history view will not work
   until we resolve this. Do not build against it yet.
3. **No pagination anywhere.** `GET /appointments/reports` returns every matching row. Always
   send a date range.
4. **No "list appointments" endpoint.** There is no `GET /appointments` or
   `GET /appointments/:id`. Use `GET /appointments/reports` with filters for both list and detail
   views for now.
5. **Reminders do not send.** §10 explains. The endpoint is a stub for a future worker.
6. **Leave entries cannot be deleted or listed directly.** They are only visible indirectly, as
   `blocked` days in the availability response.
7. **A patient can be double-booked** with two different doctors at the same time — only
   doctor-side conflicts are enforced. Add a client-side warning if this matters to your UX.
8. **Past dates are accepted.** Nothing stops booking `2020-01-01`. Please disable past dates in
   your date picker until we add a server rule.

---

## 15. Quick checklist for the frontend

- [ ] `VITE_API_BASE_URL` points at `<host>/api/v1`, and our `CLIENT_URL` matches your dev origin
- [ ] `withCredentials: true` on the axios instance
- [ ] `Authorization: Bearer <token>` sent on all eight endpoints
- [ ] Times sent as zero-padded `HH:mm`; dates as `YYYY-MM-DD`
- [ ] `time === 'ALL_DAY'` handled as a day-off marker, not a bookable slot
- [ ] Only slots with `status: 'available'` are selectable
- [ ] Any 409 triggers a refetch of availability before retrying
- [ ] Status dropdown built from the transition table in §9, current status disabled
- [ ] Cancel dialog requires a non-empty reason (both cancel routes)
- [ ] Weekly schedule form always submits the **whole** week, not just edited rows
- [ ] Returned `appointmentDate` rendered as a date only, without local-timezone conversion
- [ ] Buttons hidden per role rather than relying on a 403

Questions or a field you need added to a response — message the backend team and we will version
this document alongside the change.
















