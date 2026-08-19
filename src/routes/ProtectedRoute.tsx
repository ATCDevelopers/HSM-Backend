import {Navigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext";

/**
 * ProtectedRoute — gate for authenticated-only routes.
 *
 * DEVELOPMENT MODE: Authentication disabled - all routes are accessible.
 *
 * To re-enable authentication, see: docs/RE-ENABLE-AUTHENTICATION.md
 *
 * @param {React.ReactNode} props.children - The protected page element.
 */
function ProtectedRoute({children}) {
    // DEV: Auth disabled - allow all routes without checking authentication
    // To re-enable: Remove this return and uncomment the code block below
    return children;

    // ========================================
    // ORIGINAL AUTH LOGIC (commented out for development)
    // To re-enable: Uncomment this entire block
    // ========================================
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
    // return children;
}

export default ProtectedRoute;
