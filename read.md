sequenceDiagram
    autonumber
    actor User as Client Application
    participant Route as routes/auth.route.ts
    participant Ctrl as controllers/auth.controller.ts
    participant Svc as services/auth.service.ts
    participant Repo as repositories/auth.repository.ts
    participant DB as PostgreSQL (Drizzle)
    participant Provider as External gateway (SMS/Mail Node)

    %% PHASE 1: CODE DISPATCH STRUCTURE
    Note over User, Provider: PHASE 1: TRIGGERING THE OTP DISPATCH
    User->>Route: POST /api/v1/auth/forgot-password (JSON: contact, type)
    Route->>Ctrl: forgotPassword(req, res)
    Ctrl->>Svc: processForgotPasswordOTP(contact, type)
    Svc->>Repo: findUserByEmailOrPhone(contact)
    Repo->>DB: SELECT * FROM users WHERE email = $1 OR phone = $1
    DB-->>Repo: Returns User Object (or null)
    
    alt User profile matches criteria
        Svc->>Svc: Generate secure 6-Digit random code (e.g., crypto module)
        Svc->>Repo: storeOTPToken(userId, code, shortExpiration)
        Repo->>DB: UPDATE users SET reset_otp = $1, reset_otp_expires = $2 WHERE id = $3
        DB-->>Repo: Update successful
        Svc->>Provider: Send payload string (OTP code) to selected gateway destination
        Provider-->>User: Physical SMS text message or Email received by hardware device
    end
    Svc-->>Ctrl: Returns unified success status feedback
    Ctrl-->>User: HTTP 200 OK (Generic layout string payload response)

    %% PHASE 2: VERIFICATION & CODE EXECUTIONS
    Note over User, Provider: PHASE 2: SUBMITTING THE CODE & SETTING THE PASSWORD
    User->>Route: POST /api/v1/auth/reset-password-otp (JSON: contact, otp, newPassword)
    Route->>Ctrl: resetPasswordWithOTP(req, res)
    Ctrl->>Svc: processOTPPasswordReset(contact, otp, newPassword)
    Svc->>Repo: findUserByValidOTP(contact, otp)
    Repo->>DB: SELECT * FROM users WHERE contact = $1 AND reset_otp = $2 AND reset_otp_expires >= NOW()
    DB-->>Repo: Returns verified User details record
    
    alt Verification parameters matching true criteria
        Svc->>Svc: bcrypt.hash(newPassword, saltRounds)
        Svc->>Repo: commitNewPasswordAndWipeOTP(userId, newHashedPassword)
        Repo->>DB: UPDATE users SET password = $1, reset_otp = NULL, reset_otp_expires = NULL
        DB-->>Repo: Transaction written to disk
        Svc-->>Ctrl: Returns success signature object
        Ctrl-->>User: HTTP 200 OK ("Password updated successfully")
    else Code is bad, modified, or expired
        Svc-->>Ctrl: Throw Error Exception
        Ctrl-->>User: HTTP 400 Bad Request ("Invalid code parameters passed")
    end
