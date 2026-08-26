# Patient Soft Delete & Masked Search API Documentation

This guide provides technical specifications for integrating with the patient status lifecycle endpoints, powered by **PERN Stack (PostgreSQL, Express, Drizzle ORM, Node.js)**.

---

### 1. Deactivate Patient Profile (Soft Delete)
Updates a specific patient's profile flag to `deactivated` by populating the `deletedAt` timestamp instead of physically removing rows from the database.

* **HTTP Method:** `PUT`
* **Endpoint Path:** `/api/patients/:id/deactivate`
* **URL Parameters:**
  * `id` *(Required - String UUID)*: The unique database ID reference of the target patient.
* **Payload Structure (`application/json`):**
  ```json
  {
    "userId": "3c028ba4-2fb3-4f9e-a89b-9c7ef2b6e761"
  }
  ```
  *(Note: Passing `userId` is optional; if omitted, the system falls back to a default system user identifier string).*

#### Expected Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Patient profile deactivated successfully from active lists",
  "data": {
    "id": "5836944a-ddcf-4d68-aa75-b50511a04e6f"
  }
}
```

---

### 2. Masked Patient Database Search
Queries the patient table registry using a case-insensitive string fragment query filter pattern.

* **HTTP Method:** `GET`
* **Endpoint Path:** `/api/patients/search`
* **Query Parameters:**
  * `q` *(Optional - String)*: The search string matching against `firstName`, `lastName`, or `email`.

#### Data Enforcement & Security Capping Rules
To safeguard patient data privacy, the repository layer automatically masks attributes before emitting payload frames to the frontend layer:
* **Active Status User:** Returns all raw structural properties including personal information, contact fields, and nested address relational objects.
* **Deactivated Status User (`deletedAt IS NOT NULL`):** Filters out all identifiable values. Sensitive fields like `firstName`, `lastName`, `email`, `phoneNumber`, and the nested `address` block are strictly nullified, leaving only the structural `id` primitive and an explicit `"status": "deactivated"` flag exposed.

#### Expected Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Search query executed successfully",
  "data": [
    {
      "id": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
      "status": "active",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+255711223344",
      "address": {
        "id": "e4a2bc10-91c8-472d-bb45-3129ba01ef78",
        "region": "Kinondoni",
        "city": "Dar es Salaam",
        "country": "Tanzania"
      }
    },
    {
      "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
      "status": "deactivated",
      "firstName": null,
      "lastName": null,
      "email": null,
      "phoneNumber": null,
      "address": null
    }
  ]
}
```

---

### 3. Restricted Relational Elements (Safety Policies)

#### Scanned Images & Document Fetching Guard Rule
When a frontend application fires a `GET` request to `/api/patients/:id/documents` to retrieve historical patient file records:
* The repository layers an inner SQL query join checking against `PatientTable.deletedAt`.
* If the target user profile status indicates deactivation, the query **inhibits the retrieval** and returns an empty array placeholder `[]`, ensuring hidden file paths (such as `uploads/documents/scanned_id.jpg`) are not exposed.

#### Expected Response for Deactivated Profiles (`200 OK`)
```json
{
  "success": true,
  "message": "Patient records retrieved successfully",
  "data": []
}
```