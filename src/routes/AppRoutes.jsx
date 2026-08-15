import {lazy, Suspense} from "react";
import {Routes, Route, Outlet} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
// Guest screens stay eagerly imported so the very first paint (the login page)
// has nothing to download on demand.
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Everything behind auth is code-split: each page becomes its own chunk that the
// browser only fetches when the user actually navigates to it. This shrinks the
// initial bundle from "the whole app" down to just the login screen.
const Home = lazy(() => import("../pages/home/Home"));

/** Lightweight fallback shown while a lazily-loaded page chunk is fetched. */
function RouteFallback() {
    return (
        <div className="flex items-center justify-center py-20">
            <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"/>
        </div>
    );
}

function AppRoutes() {
    return (
        <Suspense fallback={<RouteFallback/>}>
            <Routes>
                {/* Public (guest) routes */}
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>

                {/* Protected routes — require authentication */}
                <Route
                    element={
                        <ProtectedRoute>
                            <Outlet/>
                        </ProtectedRoute>
                    }
                >
                    {/* Home */}
                    <Route path="/" element={<Home/>}/>
                </Route>
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;
