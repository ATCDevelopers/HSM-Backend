# Adding Modules and Pages - Developer Guide

This guide explains how to add new functionality to the Hospital Management System frontend, whether you're adding pages for an existing module or creating an entirely new module.

---

## Table of Contents

1. [Project Structure Overview](#project-structure-overview)
2. [Adding a Page for an Existing Module](#adding-a-page-for-an-existing-module)
3. [Adding a New Module](#adding-a-new-module)
4. [Complete Flow Example](#complete-flow-example)
5. [Best Practices](#best-practices)

---

## Project Structure Overview

```
src/
├── components/
│   ├── atoms/          # Reusable UI components (Button, Input, etc.)
│   ├── layouts/        # Layout components (Sidebar, Header, etc.)
│   └── sections/       # Section components (List, Table, etc.)
├── config/
│   └── modules.ts      # Module definitions for sidebar
├── pages/
│   ├── crud/           # Standard CRUD pages (Index, Form, Show) - reused for all resources
│   └── [module]/       # Custom module-specific pages (if needed beyond CRUD)
├── routes/
│   ├── AppRoutes.tsx   # Main route definitions
│   └── ProtectedRoute.tsx  # Auth protection wrapper
├── services/           # API service functions
└── contexts/           # React context providers
```

**Important:** All CRUD operations (Create, Read, Update, Delete) use the standard `src/pages/crud/` pages. These pages are configured dynamically based on the resource type.

---

## Standard CRUD Pattern

**Important:** All resources (patients, users, appointments, etc.) use the standard CRUD pages located in `src/pages/crud/`. These pages are dynamically configured based on the resource type.

### Standard CRUD Pages

- **Index** (`src/pages/crud/Index.tsx`) - List view with table/filters
- **Show** (`src/pages/crud/Show.tsx`) - Single resource details view
- **Form** (`src/pages/crud/Form.tsx`) - Create/Edit form

### How to Add CRUD for a New Resource

#### Step 1: Create API Service

**File:** `src/services/[resource]API.ts`

```typescript
import api from "./api";

export const patientAPI = {
    // Get all resources
    getAll: () => api.get("/patients/listpatients"),
    
    // Get single resource
    getById: (id: string) => api.get(`/patients/patient/${id}`),
    
    // Create resource
    create: (data: any) => api.post("/patients/registerpatient", data),
    
    // Update resource
    update: (id: string, data: any) => api.put(`/patients/updatepatient/${id}`, data),
    
    // Delete resource
    delete: (id: string) => api.delete(`/patients/patient/${id}`),
};

export default patientAPI;
```

#### Step 2: Add Routes

**File:** `src/routes/AppRoutes.tsx`

Add the CRUD routes for your resource:

```typescript
import {lazy} from "react";

// Lazy load CRUD pages
const Index = lazy(() => import("../pages/crud/Index"));
const Show = lazy(() => import("../pages/crud/Show"));
const Form = lazy(() => import("../pages/crud/Form"));

// Inside the protected routes section:
<Route path="/patients" element={<Index resource="patients"/>}/>
<Route path="/patients/new" element={<Form resource="patients"/>}/>
<Route path="/patients/:id" element={<Show resource="patients"/>}/>
<Route path="/patients/:id/edit" element={<Form resource="patients"/>}/>
```

#### Step 3: Configure Resource Schema

**File:** `src/config/resourceSchemas.ts` (create if doesn't exist)

Define the configuration for your resource:

```typescript
export const resourceSchemas = {
    patients: {
        name: "Patient",
        api: patientAPI,
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phoneNumber", label: "Phone Number", type: "tel" },
            // Add more fields as needed
        ],
        listColumns: ["firstName", "lastName", "email", "phoneNumber"],
    },
    // Add other resources here
};
```

### When to Create Custom Pages

Only create custom pages in `src/pages/[module]/` when you need:
- Specialized views beyond standard CRUD (e.g., dashboard widgets, reports)
- Complex workflows that don't fit the CRUD pattern
- Module-specific features (e.g., calendar view for appointments, imaging viewer for radiology)

---

## Adding a Custom Page for a Module

### Scenario: Adding a "Patient Medical History" custom page

### Step 1: Create the Custom Page Component

**File:** `src/pages/patients/MedicalHistory.tsx`

```typescript
import {useParams} from "react-router-dom";
import Button from "../../components/atoms/ui/Button";

/**
 * MedicalHistory - Custom page for patient medical history
 */
function MedicalHistory() {
    const {id} = useParams<{id: string}>();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Medical History</h1>
            <p className="text-gray-600">Patient ID: {id}</p>
            {/* Your custom medical history UI here */}
        </div>
    );
}

export default MedicalHistory;
```

### Step 2: Add the Route

**File:** `src/routes/AppRoutes.tsx`

```typescript
const MedicalHistory = lazy(() => import("../pages/patients/MedicalHistory"));

// Add to protected routes:
<Route path="/patients/:id/medical-history" element={<MedicalHistory/>}/>
```

---

## Adding a New Module

### Scenario: Adding a "Radiology" module

### Step 1: Define the Module

**File:** `src/config/modules.ts`

Add the new module to the modules array:

```typescript
export const modules: Module[] = [
    // ... existing modules ...
    
    {
        id: 'radiology',
        name: 'Radiology',
        icon: 'Camera', // Choose an appropriate icon name
        path: '/radiology',
        description: 'X-rays and imaging services',
        permissions: ['radiology.read', 'radiology.manage'],
        roles: ['SYS_ADMIN', 'MGR', 'DOC', 'LAB_TECH'],
    },
];
```

### Step 2: Create API Service

**File:** `src/services/radiologyAPI.ts`

```typescript
import api from "./api";

export const radiologyAPI = {
    getAll: () => api.get("/radiology"),
    getById: (id: string) => api.get(`/radiology/${id}`),
    create: (data: any) => api.post("/radiology", data),
    update: (id: string, data: any) => api.put(`/radiology/${id}`, data),
    delete: (id: string) => api.delete(`/radiology/${id}`),
};

export default radiologyAPI;
```

### Step 3: Add CRUD Routes

**File:** `src/routes/AppRoutes.tsx`

Add the standard CRUD routes for the new module:

```typescript
// Inside the protected routes section:
<Route path="/radiology" element={<Index resource="radiology"/>}/>
<Route path="/radiology/new" element={<Form resource="radiology"/>}/>
<Route path="/radiology/:id" element={<Show resource="radiology"/>}/>
<Route path="/radiology/:id/edit" element={<Form resource="radiology"/>}/>
```

### Step 4: Configure Resource Schema

**File:** `src/config/resourceSchemas.ts`

Add the configuration for your new resource:

```typescript
export const resourceSchemas = {
    // ... existing resources ...
    
    radiology: {
        name: "Radiology Scan",
        api: radiologyAPI,
        fields: [
            { key: "patientId", label: "Patient", type: "select" },
            { key: "scanType", label: "Scan Type", type: "select" },
            { key: "scheduledDate", label: "Scheduled Date", type: "date" },
            { key: "status", label: "Status", type: "select" },
        ],
        listColumns: ["patientId", "scanType", "scheduledDate", "status"],
    },
};
```

### Step 5: Add Custom Pages (If needed)

If the module needs specialized views beyond standard CRUD (e.g., imaging viewer, reports), create custom pages:

```
src/pages/radiology/
├── ImagingViewer.tsx    # Custom imaging viewer
├── Reports.tsx          # Radiology reports
└── [other custom pages].tsx
```

Add routes for custom pages in `AppRoutes.tsx`:

```typescript
const ImagingViewer = lazy(() => import("../pages/radiology/ImagingViewer"));

<Route path="/radiology/:id/viewer" element={<ImagingViewer/>}/>
```

### Step 6: Update Icon Mapping (If needed)

**File:** `src/components/layouts/Sidebar.tsx`

If your new module uses an icon not already in the iconMap, add it:

```typescript
import {CameraIcon} from "@heroicons/react/24/solid";

const iconMap = {
    // ... existing icons ...
    Camera: <CameraIcon className="w-5 h-5"/>,
};
```

---

## Complete Flow Example

### Example: Adding CRUD for "Prescriptions" resource

**Flow from start to finish:**

1. **Create API service**
   - File: `src/services/prescriptionAPI.ts`
   - Add CRUD functions: getAll, getById, create, update, delete

2. **Configure resource schema**
   - File: `src/config/resourceSchemas.ts`
   - Add prescriptions configuration with fields and list columns

3. **Add CRUD routes**
   - File: `src/routes/AppRoutes.tsx`
   - Add routes using standard CRUD pages with resource prop

4. **Test the flow**
   - Start dev server: `npm run dev`
   - Navigate to Pharmacy module in sidebar
   - Click through to prescriptions list
   - Test create, read, update, delete operations

### Example: Adding a Custom "Prescription Analytics" page

**Flow from start to finish:**

1. **Create the custom page component**
   - File: `src/pages/pharmacy/Analytics.tsx`
   - Build the UI using existing components (Button, Input, Table, etc.)

2. **Add the route**
   - File: `src/routes/AppRoutes.tsx`
   - Import the page: `const Analytics = lazy(() => import("../pages/pharmacy/Analytics"));`
   - Add route: `<Route path="/pharmacy/analytics" element={<Analytics/>}/>`

3. **Add navigation link** (if accessible from other pages)
   - Add `<Link to="/pharmacy/analytics">Analytics</Link>` where needed

4. **Test the flow**
   - Start dev server: `npm run dev`
   - Navigate to the custom page
   - Verify functionality

---

## Best Practices

### File Naming

- **Pages:** Use PascalCase (e.g., `PatientDetails.tsx`, `Index.tsx`)
- **Components:** Use PascalCase (e.g., `Button.tsx`, `Input.tsx`)
- **Services:** Use camelCase with API suffix (e.g., `patientAPI.ts`, `radiologyAPI.ts`)
- **Utilities:** Use camelCase (e.g., `formatDate.ts`, `validation.ts`)

### Component Structure

```typescript
/**
 * Brief description of what this component does
 */
function ComponentName() {
    // 1. Hooks (useState, useEffect, custom hooks)
    // 2. Derived state
    // 3. Event handlers
    // 4. Render

    return (
        // JSX
    );
}

export default ComponentName;
```

### Code Splitting

Always use `lazy()` for page imports to enable code splitting:

```typescript
// Good
const Patients = lazy(() => import("../pages/patients/Index"));

// Avoid
import Patients from "../pages/patients/Index";
```

### Reusable Components

Before creating new UI components, check if existing ones in `src/components/atoms/` can be used:

- **Forms:** Input, Select, TextArea, CheckBox, Radio, DateTimePicker, FileUpload
- **UI:** Button, Alert, Badge, Card, Modal, Tooltip, Dropdown
- **Sections:** List, Table

### API Services

- Keep API logic in service files, not in components
- Use the centralized `api` instance from `src/services/api.ts`
- Handle errors consistently using try/catch
- Type your API responses when possible

### Permission Checks

When adding restricted functionality, use the `can()` function from auth context:

```typescript
const {can} = useAuth();

if (!can('patients.delete')) {
    return <Alert type="error">You don't have permission</Alert>;
}
```

### Navigation

- Use `Link` for navigation (preserves state, better performance)
- Use `useNavigate` for programmatic navigation (after form submissions, etc.)

```typescript
// Good - for links
<Link to="/patients/123">View Patient</Link>

// Good - for programmatic navigation
const navigate = useNavigate();
const handleSubmit = async () => {
    await saveData();
    navigate("/patients");
};
```

---

## Quick Reference

### Files to Create for a New Resource (CRUD)

1. **API Service:** `src/services/[resource]API.ts`
2. **Resource Schema:** Update `src/config/resourceSchemas.ts`
3. **Module Definition:** Update `src/config/modules.ts` (if new module)

### Files to Create for Custom Pages

1. **Custom Page:** `src/pages/[module]/[PageName].tsx`

### Files to Modify

1. **Routes:** `src/routes/AppRoutes.tsx` - Add CRUD routes or custom page routes
2. **Sidebar:** `src/components/layouts/Sidebar.tsx` - Add icon if needed (only for new modules)
3. **API Services:** Create or update service files

### Checklist Before Committing

**For CRUD Resources:**
- [ ] API service created in `src/services/[resource]API.ts`
- [ ] Resource schema added to `src/config/resourceSchemas.ts`
- [ ] CRUD routes added to `AppRoutes.tsx` using standard CRUD pages
- [ ] Module definition added to `modules.ts` (if new module)
- [ ] Icon mapping updated in Sidebar (if new module)
- [ ] CRUD operations tested (create, read, update, delete)

**For Custom Pages:**
- [ ] Custom page component created in `src/pages/[module]/`
- [ ] Route added to `AppRoutes.tsx`
- [ ] API service created/updated (if needed)
- [ ] Page is accessible via navigation
- [ ] Page renders without errors
- [ ] Permission checks implemented (if needed)
- [ ] Code follows existing patterns and style

---

## Troubleshooting

### Page not showing up?

1. Check if route is added to `AppRoutes.tsx`
2. Verify the path matches the link
3. Check browser console for errors
4. Ensure the page is exported correctly

### Icon not displaying?

1. Check if icon is imported in Sidebar.tsx
2. Verify icon name matches the mapping
3. Check if Heroicons has the icon you're trying to use

### API not working?

1. Verify backend endpoint exists
2. Check API service file for correct endpoint path
3. Check browser network tab for failed requests
4. Ensure CORS is configured on backend

### Permission denied?

1. Check if user role has access to the module
2. Verify module definition in modules.ts includes the role
3. Check if ProtectedRoute is wrapping the route
