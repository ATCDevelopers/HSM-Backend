# Patient Management API Documentation

## Register a New Patient

**Endpoint:** `POST http://localhost:5000/api/v1/patient`

This endpoint registers a new patient in the system along with their address details.

---

### Request

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` | Required |

#### Body Parameters
```json
{
  "patient": {
    "firstName": "John",
    "lastName": "Doe",
    "gender": "Male",
    "nhifCard": "NHIF-20-987654321",
    "email": "john.oe@example.com",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "bloodGroup": "O+",
    "phoneNumber": "+255712345678"
  },
  "address": {
    "region": "Arusha",
    "city": "Arusha",
    "state": "Arusha",
    "country": "Tanzania"
  }
}
```

---

### Response

#### Status Codes
* **201 Created**: Patient successfully registered.
* **400 Bad Request**: Missing required fields or invalid data formats.
* **500 Internal Server Error**: Server-side error during registration.

#### Response Body (`201 Created`)
```json
{
    "success": true,
    "message": "Patient registered successfully",
    "data": {
        "patient": {
            "id": "4d48f098-4e41-4b1c-99ed-3ad0789f2369",
            "firstName": "John",
            "lastName": "Doe",
            "middleName": null,
            "gender": "Male",
            "nhifCard": "NHIF-20-987654321",
            "email": "john.oe@example.com",
            "dateOfBirth": "1995-05-15T00:00:00.000Z",
            "bloodGroup": "O+",
            "phoneNumber": "+255712345678",
            "photoUrl": null,
            "nationalId": null,
            "addressId": "ac7da731-e26e-43cc-a673-92fbe5fe67f9",
            "createdAt": "2026-09-15T10:21:11.336Z",
            "updatedAt": "2026-09-15T10:21:11.336Z",
            "deletedAt": null,
            "isDeleted": false,
            "createdBy": null,
            "updatedBy": null,
            "deletedBy": null
        },
        "address": {
            "id": "ac7da731-e26e-43cc-a673-92fbe5fe67f9",
            "region": "Arusha",
            "district": null,
            "city": "Arusha",
            "state": "Arusha",
            "PostalCode": null,
            "country": "Tanzania",
            "createdAt": "2026-09-15T10:21:11.311Z",
            "updatedAt": "2026-09-15T10:21:11.311Z",
            "deletedAt": null,
            "isDeleted": false,
            "createdBy": null,
            "updatedBy": null,
            "deletedBy": null
        }
    }}
```


# Patient Management API Documentation

## Get All Patients

**Endpoint:** `GET http://localhost:5000/api/v1/patients`

This endpoint retrieves a comprehensive list of all registered patients alongside their embedded address details.

---

### Request

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | `application/json` | Required |

#### Query Parameters
*(Optional)* You can implement parameters like `limit` or `page` on your backend if your dataset grows large.

---

### Response

#### Status Codes
* **200 OK**: List of patients successfully retrieved.
* **500 Internal Server Error**: Server-side error while fetching data.

#### Response Body (`200 OK`)
```json
{
    "success": true,
    "data": [
        {
            "id": "d5cd279d-21e8-4594-8181-caba4fe9c2d9",
            "firstName": "John",
            "lastName": "Doe",
            "middleName": null,
            "gender": "Male",
            "nhifCard": "NHIF-987654321",
            "email": "john.doe@example.com",
            "dateOfBirth": "1995-05-15T00:00:00.000Z",
            "bloodGroup": "O+",
            "phoneNumber": "+255712345678",
            "photoUrl": null,
            "nationalId": null,
            "address": {
                "id": "7914952f-cbad-47d8-affe-b6dea686d0fa",
                "region": "Arusha",
                "district": null,
                "city": "Arusha",
                "state": "Arusha",
                "postalCode": null,
                "country": "Tanzania"
            }
        },
        {
            "id": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4",
            "firstName": "Peter",
            "lastName": "louis",
            "middleName": "Neema",
            "gender": "Male",
            "nhifCard": "NHIF-2987654321",
            "email": "p3.doe@example.com",
            "dateOfBirth": "1995-05-15T00:00:00.000Z",
            "bloodGroup": "O+",
            "phoneNumber": "+255712345678",
            "photoUrl": null,
            "nationalId": null,
            "address": {
                "id": "bab7e742-8e06-4a84-a8fe-d0170f500728",
                "region": "Arusha",
                "district": null,
                "city": "Moshi",
                "state": "Arusha",
                "postalCode": null,
                "country": "Tanzania"
            }
        }
    ]
}
```
# Patient Management API Documentation

## Update Patient Details

**Endpoint:** `PUT http://localhost:5000/api/v1/patient/:id`

This endpoint updates specific details for an existing patient record and their corresponding address using the patient's unique ID.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the patient to update. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` | Required |

#### Body Parameters
Provide only the fields that need to be modified.
```json
{
  "patientData": {
    "lastName": "louis"
  },
  "addressData": {
    "city": "Moshi"
  }
}
```

---

### Response

#### Status Codes
* **200 OK**: Patient details successfully updated.
* **400 Bad Request**: Invalid body payload or malformed UUID.
* **404 Not Found**: Patient record with the specified ID does not exist.
* **500 Internal Server Error**: Server-side error during database modification.

#### Response Body (`200 OK`)
```json
{
    "success": true,
    "message": "Updated Successfully",
    "data": {
        "id": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4",
        "firstName": "Peter",
        "lastName": "louis",
        "middleName": "Neema",
        "gender": "Male",
        "nhifCard": "NHIF-2987654321",
        "email": "p3.doe@example.com",
        "dateOfBirth": "1995-05-15T00:00:00.000Z",
        "bloodGroup": "O+",
        "phoneNumber": "+255712345678",
        "photoUrl": null,
        "nationalId": null,
        "addressId": "bab7e742-8e06-4a84-a8fe-d0170f500728",
        "createdAt": "2026-09-14T09:47:05.722Z",
        "updatedAt": "2026-09-15T07:32:19.266Z",
        "deletedAt": null,
        "isDeleted": false,
        "createdBy": null,
        "updatedBy": null,
        "deletedBy": null
    }
}
```




# Patient Management API Documentation

## Download Patient PDF Report

**Endpoint:** `GET http://localhost:5000/api/v1/:id/pdf`

This endpoint generates and returns a downloadable, printer-friendly PDF report containing all recorded demographic and address information for a specific patient.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the patient whose PDF report is being generated. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | `application/pdf` | Required |

---

### Response

#### Status Codes
* **200 OK**: PDF file generated successfully and sent as a binary stream.
* **404 Not Found**: No patient found with the provided ID.
* **500 Internal Server Error**: Failed to compile or stream the PDF file.

#### Response Headers (`200 OK`)
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="patient-report-b7190474.pdf"
```

#### Response Body
A binary stream representing the **compiled PDF document**.

---

### How to Download the PDF on the Frontend

When downloading binary files like PDFs, you must handle the response as a **Blob** so the browser can trigger a clean download instead of opening raw corrupted text.

#### Implementation using Fetch API
```javascript
const downloadPatientPdf = async (patientId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/v1/${patientId}/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate or download the patient PDF report');
    }

    // Convert response stream to a binary Blob
    const blob = await response.blob();
    
    // Create an invisible anchor tag to trigger the browser download manager
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `patient_report_${patientId}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up memory resources
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Download Error:', error.message);
  }
};

// Example usage using the patient ID:
downloadPatientPdf('b7190474-deb5-4f5d-8d5a-25212ea7f3b4');
```




# Patient Management API Documentation

## Soft-Delete Patient Profile

**Endpoint:** `DELETE http://localhost:5000/api/v1/patients/:id`

This endpoint performs a soft-delete on a specific patient profile, hiding it from active clinical views while safely retaining the historical data in the database for auditing compliance.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the patient profile to be soft-deleted. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | `application/json` | Required |

---

### Response

#### Status Codes
* **200 OK**: Patient profile safely flagged as deleted.
* **404 Not Found**: No patient found matching the provided ID.
* **500 Internal Server Error**: Database constraint error while updating the deletion flag.

#### Response Body (`200 OK`)
```json
{
    "success": true,
    "message": "Patient profile soft-deleted successfully from active clinical views.",
    "data": {
        "id": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4"
    }
}
```

---

### How to Connect with the Frontend

#### Fetch API Implementation
```javascript
const deletePatientProfile = async (patientId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/v1/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete the patient profile');
    }

    console.log(result.message); // Profile soft-deleted message
    return result.data.id; // Returns deleted ID to update UI state
  } catch (error) {
    console.error('Deletion Error:', error.message);
    throw error;
  }
};
```

# Patient Management API Documentation

## Recover Soft-Deleted Patient Profile

**Endpoint:** `POST http://localhost:5000/api/v1/patients/:id/recover`

This endpoint recovers and restores a soft-deleted patient profile, shifting it back into the active medical pool.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the soft-deleted patient profile to recover. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | `application/json` | Required |

---

### Response

#### Status Codes
* **200 OK**: Patient profile safely restored.
* **404 Not Found**: No deleted record matching this ID was found.
* **500 Internal Server Error**: Database write failure during restoration.

#### Response Body (`200 OK`)
```json
{
    "success": true,
    "message": "Patient profile successfully recovered and restored to active pool.",
    "data": {
        "id": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4"
    }
}
```

---

### How to Connect with the Frontend

#### Fetch API Implementation
```javascript
const recoverPatientProfile = async (patientId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/v1/patients/${patientId}/recover`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to recover the patient profile');
    }

    console.log(result.message); 
    return result.data.id; // Returns the restored patient ID to update UI state
  } catch (error) {
    console.error('Recovery Error:', error.message);
    throw error;
  }
};
```




# Patient Management API Documentation

## Upload Patient Documents

**Endpoint:** `POST http://localhost:5000/api/v1/:id/documents`

This endpoint uploads physical files or digital records (such as medical scans, ID cards, or insurance receipts), stores them securely on the server, and binds the generated file metadata link directly to the target patient's profile.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the patient profile receiving the uploads. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | `multipart/form-data` | Required |

#### Body Parameters (Multipart FormData)

| Field Key | Type | Description |
| :--- | :--- | :--- |
| `document` | `file (binary)` | The actual file object to be uploaded (PDF, PNG, JPEG, etc.). |

---

### Response

#### Status Codes
* **201 Created**: File processed, renamed, saved to disk, and linked to patient successfully.
* **400 Bad Request**: Invalid file attachment or missing binary payload keys.
* **404 Not Found**: Target patient profile does not exist.
* **500 Internal Server Error**: Disk storage system write failure or local folder permissions error.

#### Response Body (`201 Created`)
```json
{
    "success": true,
    "message": "Successfully imported",
    "data": {
        "id": "d3d67c83-1fee-45ea-8a12-2fb1d28fd5c1",
        "patientId": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4",
        "documentName": "Crop Yield Predition anaylis.pdf",
        "fileUrl": "uploads/documents/1789459055956-480460860.pdf",
        "mimeType": "application/pdf",
        "fileSize": "626.2 KB",
        "createdAt": "2026-09-15T10:57:35.992Z",
        "updatedAt": "2026-09-15T10:57:35.992Z",
        "deletedAt": null,
        "isDeleted": false,
        "createdBy": null,
        "updatedBy": null,
        "deletedBy": null
    }
}
```




# Patient Management API Documentation

## Get Patient Documents

**Endpoint:** `GET http://localhost:5000/api/v1/:id/documents`

This endpoint retrieves an array of all uploaded documents and media files linked to a specific patient's profile.

---

### Request

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (UUID)` | The unique identifier of the patient whose documents are being fetched. |

#### Headers

| Key | Type | Value | Description |
| :--- | :--- | :--- | :--- |
| `Accept` | `string` | `application/json` | Required |

---

### Response

#### Status Codes
* **200 OK**: Documents successfully retrieved.
* **404 Not Found**: Patient profile does not exist.
* **500 Internal Server Error**: Server database retrieval exception.

#### Response Body (`200 OK`)
```json
{
    "success": true,
    "message": "Patients Documents found",
    "data": [
        {
            "id": "d3d67c83-1fee-45ea-8a12-2fb1d28fd5c1",
            "patientId": "b7190474-deb5-4f5d-8d5a-25212ea7f3b4",
            "documentName": "Crop Yield Predition anaylis.pdf",
            "fileUrl": "uploads/documents/1789459055956-480460860.pdf",
            "mimeType": "application/pdf",
            "fileSize": "626.2 KB",
            "createdAt": "2026-09-15T10:57:35.992Z",
            "updatedAt": "2026-09-15T10:57:35.992Z",
            "deletedAt": null,
            "isDeleted": false,
            "createdBy": null,
            "updatedBy": null,
            "deletedBy": null
        }
    ]
}
```


