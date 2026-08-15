import {Navigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext";

/**
 * ProtectedRoute — gate for authenticated-only routes.
 *
 * While the provider is still rehydrating the session (`loading`), render a
 * lightweight placeholder so we don't bounce the user to /login on a refresh
 * before the token has been validated. Once settled, unauthenticated users are
 * redirected to the login page.
 *
 * @param {React.ReactNode} props.children - The protected page element.
 */
function ProtectedRoute({children}) {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center text-gray-500">
                Loading…
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return children;
}

export default ProtectedRoute;
