# Patient Document Upload Engine Documentation

### Endpoint Details
* **Method:** `POST`
* **URL Path:** `/api/patients/:id/documents`
* **URL Params:** `:id` (The strict string UUID of the patient)
* **Request Header:** `Content-Type: multipart/form-data`
* **Form-Data Key:** `document` (The field key mapping the raw file binary payload)

---

### 🛡️ Constraints & Validation Rules
* **Allowed Extensions:** Only scanned images (`.jpg`, `.jpeg`, `.png`) and document files (`.pdf`).
* **Strict Size Boundary:** Maximum of **5MB**. Any file exceeding this file size limit is automatically blocked.
* **Database Management:** The metadata links to the PostgreSQL database while files save directly to local server storage disk.

---

### 💻 Frontend Integration Code Sample (JavaScript / Axios)

```javascript
import axios from "axios";

async function uploadPatientFile(patientId, fileObject) {
  const formData = new FormData();
  formData.append("document", fileObject); // Use the exact key name "document"

  try {
    const response = await axios.post(
      `http://localhost:5000/api/patients/${patientId}/documents`, 
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload rejected:", error.response?.data?.message || error.message);
  }
}
```

---

### 📦 Expected JSON Server Responses

#### 🟢 201 Created (Success Payload)
```json
{
  "success": true,
  "message": "Document uploaded and attached successfully",
  "data": {
    "id": "c62bf6a9-83ab-4ef1-968b-841804f5e042",
    "patientId": "5836944a-ddcf-4d68-aa75-b50511a04e6f",
    "documentName": "insurance_scan.jpg",
    "fileUrl": "uploads/documents/1787133713375-29831322.jpg",
    "mimeType": "image/jpeg",
    "fileSize": "450.5 KB",
    "createdAt": "2026-08-19T10:25:00.000Z"
  }
}
```

#### 🔴 400 Bad Request (Size Limit Breach)
```json
{
  "success": false,
  "message": "File upload blocked! The file exceeds the maximum allowed limit of 5MB."
}
```

#### 🔵 GET Historic Document Lists
* To fetch, filter, or retrieve a list of all historical patient documents, dispatch a **GET** request directly to the same URL context route: `/api/patients/:id/documents`.