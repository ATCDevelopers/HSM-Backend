# Re-Enabling Authentication

This document explains how to re-enable authentication after development mode.

## Overview

During development, authentication was disabled to allow the team to work on features without requiring login. The following changes were made:

1. **ProtectedRoute.tsx**: Bypasses all auth checks
2. **AuthProvider.tsx**: Uses a mock admin user instead of API authentication
3. **AuthProvider.tsx**: `can()` function grants all permissions
4. **api.ts**: Token is optional for API requests

## How to Re-Enable Authentication

### Step 1: Restore ProtectedRoute Logic

**File**: `src/routes/ProtectedRoute.tsx`

Remove the early return and uncomment the original auth logic:

```typescript
function ProtectedRoute({children}) {
    // DEV: Auth disabled - allow all routes
    return children;  // REMOVE THIS LINE

    // Original auth logic (commented out for development)
    // const {isAuthenticated, loading} = useAuth();
    // if (loading) {
    //     return (
    //         <div
    //             className="min-h-screen flex items-center justify-center text-gray-500">
    //             Loading…
    //         </div>
    //     );
    // }
    // if (!isAuthenticated) {
    //     return <Navigate to="/login" replace/>;
    // }
    // return children;  // UNCOMMENT THIS BLOCK
}
```

### Step 2: Restore User Fetching in AuthProvider

**File**: `src/auth/AuthProvider.tsx`

Replace the mock user with the original API fetching logic:

```typescript
export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // DEV: Set a mock user for development to avoid auth checks
    useEffect(() => {
        const mockUser: User = {
            id: 1,
            firstName: "Dev",
            lastName: "User",
            username: "dev",
            email: "dev@example.com",
            phoneNumber: "+1234567890",
            roles: ["SYS_ADMIN"],
            permissions: ["*"],
        };
        setUser(mockUser);
        setLoading(false);
    }, []);  // REPLACE THIS ENTIRE useEffect WITH THE CODE BELOW

    // Original rehydrate logic (commented out for development)
    // useEffect(() => {
    //     const token = getToken();
    //     if (!token) {
    //         setLoading(false);
    //         return;
    //     }

    //     let active = true;
    //     const fetchUser = async () => {
    //         try {
    //             const res = await authAPI.me();
    //             if (active) setUser(extractRecord<User>(res));
    //         } catch {
    //             if (active) {
    //                 clearToken();
    //                 setUser(null);
    //             }
    //         } finally {
    //             if (active) setLoading(false);
    //         }
    //     };

    //     fetchUser();

    //     return () => {
    //         active = false;
    //     };
    // }, []);
```

### Step 3: Restore Permission Logic in AuthProvider

**File**: `src/auth/AuthProvider.tsx`

Restore the original permission checking logic:

```typescript
const can = (permission: string): boolean => {
    // DEV: Grant all permissions for development
    return true;  // REMOVE THIS LINE

    // Original permission logic (commented out for development)
    // if (!user) return false;
    // if (user.roles?.includes("superadmin")) return true;
    // return user.permissions?.includes(permission) ?? false;  // UNCOMMENT THIS BLOCK
};
```

### Step 4: Restore API Token Enforcement (Optional)

**File**: `src/services/api.ts`

The API interceptor already handles token attachment correctly. The comment was added for documentation purposes. No changes needed unless you want to enforce token presence:

```typescript
// Outgoing: attach the bearer token (if any) and convert camelCase -> snake_case.
// DEV: Token is optional for development - requests work without auth
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // To enforce token presence, add:
    // if (!token) {
    //     throw new Error("Authentication required");
    // }
    if (isPlainObject(config.data) || Array.isArray(config.data)) {
        config.data = convertKeys(config.data, toSnake);
    }
    return config;
});
```

## Verification

After re-enabling authentication:

1. Restart the dev server: `npm run dev`
2. Navigate to the app - you should be redirected to `/login`
3. Log in with valid credentials
4. Verify protected routes are accessible only after authentication
5. Verify permission checks work correctly

## Backend Requirements

Ensure your backend API is running and configured:
- Authentication endpoints (`/login`, `/register`, `/me`) are functional
- JWT tokens are properly issued and validated
- Permission system is correctly implemented

## Rollback

If you need to disable authentication again for development, simply reverse the steps above by:
1. Adding the early return in `ProtectedRoute.tsx`
2. Replacing the user fetching with mock user in `AuthProvider.tsx`
3. Making `can()` always return `true` in `AuthProvider.tsx`
